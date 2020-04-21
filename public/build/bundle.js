
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Display.svelte generated by Svelte v3.20.1 */

    const file = "src\\Display.svelte";

    function create_fragment(ctx) {
    	let input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			input.value = /*display*/ ctx[0];
    			attr_dev(input, "class", "input svelte-1c9un78");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "textview");
    			input.disabled = true;
    			add_location(input, file, 5, 0, 59);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*display*/ 1 && input.value !== /*display*/ ctx[0]) {
    				prop_dev(input, "value", /*display*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { display = "" } = $$props;
    	const writable_props = ["display"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Display> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Display", $$slots, []);

    	$$self.$set = $$props => {
    		if ("display" in $$props) $$invalidate(0, display = $$props.display);
    	};

    	$$self.$capture_state = () => ({ display });

    	$$self.$inject_state = $$props => {
    		if ("display" in $$props) $$invalidate(0, display = $$props.display);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [display];
    }

    class Display extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { display: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Display",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get display() {
    		throw new Error("<Display>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set display(value) {
    		throw new Error("<Display>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */

    const { Error: Error_1, console: console_1 } = globals;
    const file$1 = "src\\App.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let button2;
    	let t8;
    	let button3;
    	let t10;
    	let button4;
    	let t12;
    	let button5;
    	let t14;
    	let button6;
    	let t16;
    	let button7;
    	let t18;
    	let button8;
    	let t20;
    	let button9;
    	let t22;
    	let button10;
    	let t24;
    	let button11;
    	let t26;
    	let button12;
    	let t28;
    	let button13;
    	let t30;
    	let button14;
    	let t32;
    	let button15;
    	let t34;
    	let button16;
    	let t36;
    	let button17;
    	let current;
    	let dispose;

    	const display = new Display({
    			props: { display: /*view*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Taschenrechner";
    			t1 = space();
    			div = element("div");
    			create_component(display.$$.fragment);
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "7";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "8";
    			t6 = space();
    			button2 = element("button");
    			button2.textContent = "9";
    			t8 = space();
    			button3 = element("button");
    			button3.textContent = "+";
    			t10 = space();
    			button4 = element("button");
    			button4.textContent = "4";
    			t12 = space();
    			button5 = element("button");
    			button5.textContent = "5";
    			t14 = space();
    			button6 = element("button");
    			button6.textContent = "6";
    			t16 = space();
    			button7 = element("button");
    			button7.textContent = "-";
    			t18 = space();
    			button8 = element("button");
    			button8.textContent = "1";
    			t20 = space();
    			button9 = element("button");
    			button9.textContent = "2";
    			t22 = space();
    			button10 = element("button");
    			button10.textContent = "3";
    			t24 = space();
    			button11 = element("button");
    			button11.textContent = "/";
    			t26 = space();
    			button12 = element("button");
    			button12.textContent = ".";
    			t28 = space();
    			button13 = element("button");
    			button13.textContent = "0";
    			t30 = space();
    			button14 = element("button");
    			button14.textContent = "*";
    			t32 = space();
    			button15 = element("button");
    			button15.textContent = "clear";
    			t34 = space();
    			button16 = element("button");
    			button16.textContent = "=";
    			t36 = space();
    			button17 = element("button");
    			button17.textContent = "◀";
    			attr_dev(h1, "class", "headline svelte-1o92k49");
    			add_location(h1, file$1, 50, 1, 926);
    			attr_dev(button0, "class", "button svelte-1o92k49");
    			add_location(button0, file$1, 56, 4, 1041);
    			attr_dev(button1, "class", "button svelte-1o92k49");
    			add_location(button1, file$1, 57, 4, 1109);
    			attr_dev(button2, "class", "button svelte-1o92k49");
    			add_location(button2, file$1, 58, 4, 1177);
    			attr_dev(button3, "class", "operator button svelte-1o92k49");
    			add_location(button3, file$1, 59, 4, 1245);
    			attr_dev(button4, "class", "button svelte-1o92k49");
    			add_location(button4, file$1, 61, 4, 1324);
    			attr_dev(button5, "class", "button svelte-1o92k49");
    			add_location(button5, file$1, 62, 4, 1392);
    			attr_dev(button6, "class", "button svelte-1o92k49");
    			add_location(button6, file$1, 63, 4, 1460);
    			attr_dev(button7, "class", "operator button svelte-1o92k49");
    			add_location(button7, file$1, 64, 4, 1528);
    			attr_dev(button8, "class", "button svelte-1o92k49");
    			add_location(button8, file$1, 66, 4, 1607);
    			attr_dev(button9, "class", "button svelte-1o92k49");
    			add_location(button9, file$1, 67, 4, 1675);
    			attr_dev(button10, "class", "button svelte-1o92k49");
    			add_location(button10, file$1, 68, 4, 1743);
    			attr_dev(button11, "class", "operator button svelte-1o92k49");
    			add_location(button11, file$1, 69, 4, 1811);
    			attr_dev(button12, "class", "button svelte-1o92k49");
    			add_location(button12, file$1, 71, 4, 1890);
    			attr_dev(button13, "class", "button svelte-1o92k49");
    			attr_dev(button13, "id", "colspan");
    			add_location(button13, file$1, 72, 4, 1958);
    			attr_dev(button14, "class", "operator button svelte-1o92k49");
    			add_location(button14, file$1, 73, 4, 2039);
    			attr_dev(button15, "class", "button svelte-1o92k49");
    			set_style(button15, "background-color", "#D21906");
    			set_style(button15, "color", "white");
    			add_location(button15, file$1, 75, 2, 2116);
    			attr_dev(button16, "class", "button svelte-1o92k49");
    			attr_dev(button16, "id", "colspan");
    			set_style(button16, "background-color", "#A4A620");
    			add_location(button16, file$1, 76, 4, 2233);
    			attr_dev(button17, "class", "button svelte-1o92k49");
    			set_style(button17, "background-color", "#FF7C12");
    			add_location(button17, file$1, 77, 4, 2343);
    			attr_dev(div, "class", "grid-container svelte-1o92k49");
    			add_location(div, file$1, 52, 1, 971);
    			attr_dev(main, "class", "svelte-1o92k49");
    			add_location(main, file$1, 49, 0, 917);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			mount_component(display, div, null);
    			append_dev(div, t2);
    			append_dev(div, button0);
    			append_dev(div, t4);
    			append_dev(div, button1);
    			append_dev(div, t6);
    			append_dev(div, button2);
    			append_dev(div, t8);
    			append_dev(div, button3);
    			append_dev(div, t10);
    			append_dev(div, button4);
    			append_dev(div, t12);
    			append_dev(div, button5);
    			append_dev(div, t14);
    			append_dev(div, button6);
    			append_dev(div, t16);
    			append_dev(div, button7);
    			append_dev(div, t18);
    			append_dev(div, button8);
    			append_dev(div, t20);
    			append_dev(div, button9);
    			append_dev(div, t22);
    			append_dev(div, button10);
    			append_dev(div, t24);
    			append_dev(div, button11);
    			append_dev(div, t26);
    			append_dev(div, button12);
    			append_dev(div, t28);
    			append_dev(div, button13);
    			append_dev(div, t30);
    			append_dev(div, button14);
    			append_dev(div, t32);
    			append_dev(div, button15);
    			append_dev(div, t34);
    			append_dev(div, button16);
    			append_dev(div, t36);
    			append_dev(div, button17);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[7], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[8], false, false, false),
    				listen_dev(button3, "click", /*click_handler_3*/ ctx[9], false, false, false),
    				listen_dev(button4, "click", /*click_handler_4*/ ctx[10], false, false, false),
    				listen_dev(button5, "click", /*click_handler_5*/ ctx[11], false, false, false),
    				listen_dev(button6, "click", /*click_handler_6*/ ctx[12], false, false, false),
    				listen_dev(button7, "click", /*click_handler_7*/ ctx[13], false, false, false),
    				listen_dev(button8, "click", /*click_handler_8*/ ctx[14], false, false, false),
    				listen_dev(button9, "click", /*click_handler_9*/ ctx[15], false, false, false),
    				listen_dev(button10, "click", /*click_handler_10*/ ctx[16], false, false, false),
    				listen_dev(button11, "click", /*click_handler_11*/ ctx[17], false, false, false),
    				listen_dev(button12, "click", /*click_handler_12*/ ctx[18], false, false, false),
    				listen_dev(button13, "click", /*click_handler_13*/ ctx[19], false, false, false),
    				listen_dev(button14, "click", /*click_handler_14*/ ctx[20], false, false, false),
    				listen_dev(button15, "click", /*click_handler_15*/ ctx[21], false, false, false),
    				listen_dev(button16, "click", /*handleEqual*/ ctx[4], false, false, false),
    				listen_dev(button17, "click", /*click_handler_16*/ ctx[22], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			const display_changes = {};
    			if (dirty & /*view*/ 1) display_changes.display = /*view*/ ctx[0];
    			display.$set(display_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(display.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(display.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(display);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let view = "";

    	async function calculate() {
    		const options = {
    			method: "POST",
    			headers: new Headers({
    					"content-type": "text/plain",
    					"Access-Control-Allow-Origin": "*"
    				}),
    			body: JSON.stringify({ calculation: view })
    		};

    		console.log("view" + view);
    		const response = await fetch("http://localhost:8081/calculate", options);
    		const todo = await response;
    		console.log(todo);

    		if (response.ok) {
    			return todo;
    		} else {
    			throw new Error(todo);
    		}
    	}

    	function insert(num) {
    		$$invalidate(0, view = view + num);
    	}

    	function clean() {
    		$$invalidate(0, view = "");
    	}

    	function back() {
    		if (view.length > 0) {
    			$$invalidate(0, view = view.substring(0, view.length - 1));
    		}
    	}

    	function handleEqual(e) {
    		calculate().then(response => {
    			alert(response);
    		}).catch(error => {
    			alert(error.message);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	const click_handler = () => insert("7");
    	const click_handler_1 = () => insert("8");
    	const click_handler_2 = () => insert("9");
    	const click_handler_3 = () => insert("+");
    	const click_handler_4 = () => insert("4");
    	const click_handler_5 = () => insert("5");
    	const click_handler_6 = () => insert("6");
    	const click_handler_7 = () => insert("-");
    	const click_handler_8 = () => insert("1");
    	const click_handler_9 = () => insert("2");
    	const click_handler_10 = () => insert("3");
    	const click_handler_11 = () => insert("/");
    	const click_handler_12 = () => insert(".");
    	const click_handler_13 = () => insert("0");
    	const click_handler_14 = () => insert("*");
    	const click_handler_15 = () => clean();
    	const click_handler_16 = () => back();

    	$$self.$capture_state = () => ({
    		Display,
    		view,
    		calculate,
    		insert,
    		clean,
    		back,
    		handleEqual
    	});

    	$$self.$inject_state = $$props => {
    		if ("view" in $$props) $$invalidate(0, view = $$props.view);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		view,
    		insert,
    		clean,
    		back,
    		handleEqual,
    		calculate,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15,
    		click_handler_16
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
