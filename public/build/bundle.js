
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
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

    /* src\App.svelte generated by Svelte v3.20.1 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let body;
    	let h1;
    	let t1;
    	let div;
    	let form;
    	let input;
    	let t2;
    	let table;
    	let tr0;
    	let td0;
    	let button0;
    	let t4;
    	let td1;
    	let button1;
    	let t6;
    	let td2;
    	let button2;
    	let t8;
    	let td3;
    	let button3;
    	let t10;
    	let tr1;
    	let td4;
    	let button4;
    	let t12;
    	let td5;
    	let button5;
    	let t14;
    	let td6;
    	let button6;
    	let t16;
    	let td7;
    	let button7;
    	let t18;
    	let tr2;
    	let td8;
    	let button8;
    	let t20;
    	let td9;
    	let button9;
    	let t22;
    	let td10;
    	let button10;
    	let t24;
    	let td11;
    	let button11;
    	let t26;
    	let tr3;
    	let td12;
    	let button12;
    	let t28;
    	let td13;
    	let button13;
    	let t30;
    	let td14;
    	let button14;
    	let t32;
    	let tr4;
    	let td15;
    	let button15;
    	let t34;
    	let td16;
    	let button16;
    	let t36;
    	let td17;
    	let button17;
    	let t38;
    	let script;

    	const block = {
    		c: function create() {
    			body = element("body");
    			h1 = element("h1");
    			h1.textContent = "Taschenrechner";
    			t1 = space();
    			div = element("div");
    			form = element("form");
    			input = element("input");
    			t2 = space();
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			button0 = element("button");
    			button0.textContent = "7";
    			t4 = space();
    			td1 = element("td");
    			button1 = element("button");
    			button1.textContent = "8";
    			t6 = space();
    			td2 = element("td");
    			button2 = element("button");
    			button2.textContent = "9";
    			t8 = space();
    			td3 = element("td");
    			button3 = element("button");
    			button3.textContent = "+";
    			t10 = space();
    			tr1 = element("tr");
    			td4 = element("td");
    			button4 = element("button");
    			button4.textContent = "4";
    			t12 = space();
    			td5 = element("td");
    			button5 = element("button");
    			button5.textContent = "5";
    			t14 = space();
    			td6 = element("td");
    			button6 = element("button");
    			button6.textContent = "6";
    			t16 = space();
    			td7 = element("td");
    			button7 = element("button");
    			button7.textContent = "-";
    			t18 = space();
    			tr2 = element("tr");
    			td8 = element("td");
    			button8 = element("button");
    			button8.textContent = "1";
    			t20 = space();
    			td9 = element("td");
    			button9 = element("button");
    			button9.textContent = "2";
    			t22 = space();
    			td10 = element("td");
    			button10 = element("button");
    			button10.textContent = "3";
    			t24 = space();
    			td11 = element("td");
    			button11 = element("button");
    			button11.textContent = "/";
    			t26 = space();
    			tr3 = element("tr");
    			td12 = element("td");
    			button12 = element("button");
    			button12.textContent = ".";
    			t28 = space();
    			td13 = element("td");
    			button13 = element("button");
    			button13.textContent = "0";
    			t30 = space();
    			td14 = element("td");
    			button14 = element("button");
    			button14.textContent = "*";
    			t32 = space();
    			tr4 = element("tr");
    			td15 = element("td");
    			button15 = element("button");
    			button15.textContent = "clear";
    			t34 = space();
    			td16 = element("td");
    			button16 = element("button");
    			button16.textContent = "=";
    			t36 = space();
    			td17 = element("td");
    			button17 = element("button");
    			button17.textContent = "◀";
    			t38 = space();
    			script = element("script");
    			script.textContent = "function insert(num){\n    \t\tdocument.form.textview.value = document.form.textview.value+num;\n\t\t}\n        function equal(){\n            var exp = document.form.textview.value;\n            document.form.textview.value = eval(exp);\n        }\n        function clean(){\n            document.form.textview.value = \"\";\n        }\n        function back(){\n            var exp = document.form.textview.value;\n            if(exp){\n                document.form.textview.value = exp.substring(0,exp.length-1);\n            }\n        }";
    			attr_dev(h1, "class", "headline svelte-iphlt6");
    			add_location(h1, file, 64, 0, 1190);
    			attr_dev(input, "class", "input svelte-iphlt6");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "textview");
    			input.disabled = true;
    			add_location(input, file, 67, 3, 1294);
    			attr_dev(form, "action", "");
    			attr_dev(form, "name", "form");
    			add_location(form, file, 66, 2, 1262);
    			set_style(button0, "margin-bottom", "0.5em");
    			set_style(button0, "margin-right", "0.5em");
    			attr_dev(button0, "onclick", "insert(7)");
    			attr_dev(button0, "class", "svelte-iphlt6");
    			add_location(button0, file, 71, 11, 1430);
    			add_location(td0, file, 71, 7, 1426);
    			set_style(button1, "margin-bottom", "0.5em");
    			set_style(button1, "margin-right", "0.5em");
    			attr_dev(button1, "onclick", "insert(8)");
    			attr_dev(button1, "class", "svelte-iphlt6");
    			add_location(button1, file, 72, 20, 1545);
    			add_location(td1, file, 72, 16, 1541);
    			set_style(button2, "margin-bottom", "0.5em");
    			set_style(button2, "margin-right", "0.5em");
    			attr_dev(button2, "onclick", "insert(9)");
    			attr_dev(button2, "class", "svelte-iphlt6");
    			add_location(button2, file, 73, 20, 1660);
    			add_location(td2, file, 73, 16, 1656);
    			set_style(button3, "margin-bottom", "0.5em");
    			attr_dev(button3, "onclick", "insert('+')");
    			attr_dev(button3, "class", "operator svelte-iphlt6");
    			add_location(button3, file, 74, 20, 1775);
    			add_location(td3, file, 74, 16, 1771);
    			add_location(tr0, file, 70, 12, 1414);
    			set_style(button4, "margin-bottom", "0.5em");
    			attr_dev(button4, "onclick", "insert(4)");
    			attr_dev(button4, "class", "svelte-iphlt6");
    			add_location(button4, file, 77, 20, 1914);
    			add_location(td4, file, 77, 16, 1910);
    			set_style(button5, "margin-bottom", "0.5em");
    			attr_dev(button5, "onclick", "insert(5)");
    			attr_dev(button5, "class", "svelte-iphlt6");
    			add_location(button5, file, 78, 20, 2008);
    			add_location(td5, file, 78, 16, 2004);
    			set_style(button6, "margin-bottom", "0.5em");
    			attr_dev(button6, "onclick", "insert(6)");
    			attr_dev(button6, "class", "svelte-iphlt6");
    			add_location(button6, file, 79, 20, 2102);
    			add_location(td6, file, 79, 16, 2098);
    			set_style(button7, "margin-bottom", "0.5em");
    			attr_dev(button7, "onclick", "insert('-')");
    			attr_dev(button7, "class", "operator svelte-iphlt6");
    			add_location(button7, file, 80, 20, 2196);
    			add_location(td7, file, 80, 16, 2192);
    			add_location(tr1, file, 76, 3, 1889);
    			set_style(button8, "margin-bottom", "0.5em");
    			attr_dev(button8, "onclick", "insert(1)");
    			attr_dev(button8, "class", "svelte-iphlt6");
    			add_location(button8, file, 83, 20, 2344);
    			add_location(td8, file, 83, 16, 2340);
    			set_style(button9, "margin-bottom", "0.5em");
    			attr_dev(button9, "onclick", "insert(2)");
    			attr_dev(button9, "class", "svelte-iphlt6");
    			add_location(button9, file, 84, 20, 2438);
    			add_location(td9, file, 84, 16, 2434);
    			set_style(button10, "margin-bottom", "0.5em");
    			attr_dev(button10, "onclick", "insert(3)");
    			attr_dev(button10, "class", "svelte-iphlt6");
    			add_location(button10, file, 85, 20, 2532);
    			add_location(td10, file, 85, 16, 2528);
    			set_style(button11, "margin-bottom", "0.5em");
    			attr_dev(button11, "onclick", "insert('/')");
    			attr_dev(button11, "class", "operator svelte-iphlt6");
    			add_location(button11, file, 86, 20, 2626);
    			add_location(td11, file, 86, 16, 2622);
    			add_location(tr2, file, 82, 12, 2319);
    			set_style(button12, "margin-bottom", "0.5em");
    			attr_dev(button12, "onclick", "insert('.')");
    			attr_dev(button12, "class", "svelte-iphlt6");
    			add_location(button12, file, 89, 20, 2774);
    			add_location(td12, file, 89, 16, 2770);
    			set_style(button13, "width", "172px");
    			set_style(button13, "margin-bottom", "0.5em");
    			attr_dev(button13, "onclick", "insert(0)");
    			attr_dev(button13, "class", "svelte-iphlt6");
    			add_location(button13, file, 90, 32, 2882);
    			attr_dev(td13, "colspan", "2");
    			add_location(td13, file, 90, 16, 2866);
    			set_style(button14, "margin-bottom", "0.5em");
    			attr_dev(button14, "onclick", "insert('*')");
    			attr_dev(button14, "class", "operator svelte-iphlt6");
    			add_location(button14, file, 91, 20, 2989);
    			add_location(td14, file, 91, 16, 2985);
    			add_location(tr3, file, 88, 12, 2749);
    			set_style(button15, "background-color", "#D21906");
    			set_style(button15, "color", "white");
    			set_style(button15, "margin-bottom", "0.5em");
    			attr_dev(button15, "onclick", "clean()");
    			attr_dev(button15, "class", "svelte-iphlt6");
    			add_location(button15, file, 94, 8, 3135);
    			add_location(td15, file, 94, 4, 3131);
    			set_style(button16, "background-color", "#A4A620");
    			set_style(button16, "width", "172px");
    			set_style(button16, "margin-bottom", "0.5em");
    			attr_dev(button16, "onclick", "equal()");
    			attr_dev(button16, "class", "svelte-iphlt6");
    			add_location(button16, file, 95, 20, 3272);
    			attr_dev(td16, "colspan", "2");
    			add_location(td16, file, 95, 4, 3256);
    			set_style(button17, "margin-bottom", "0.5em");
    			set_style(button17, "background-color", "#FF7C12");
    			attr_dev(button17, "onclick", "back()");
    			attr_dev(button17, "class", "svelte-iphlt6");
    			add_location(button17, file, 96, 20, 3404);
    			add_location(td17, file, 96, 16, 3400);
    			add_location(tr4, file, 93, 12, 3112);
    			set_style(table, "margin", "0 auto");
    			add_location(table, file, 69, 5, 1370);
    			attr_dev(div, "class", "calculator svelte-iphlt6");
    			add_location(div, file, 65, 4, 1235);
    			add_location(script, file, 100, 1, 3545);
    			attr_dev(body, "class", "svelte-iphlt6");
    			add_location(body, file, 63, 0, 1183);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, h1);
    			append_dev(body, t1);
    			append_dev(body, div);
    			append_dev(div, form);
    			append_dev(form, input);
    			append_dev(div, t2);
    			append_dev(div, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, button0);
    			append_dev(tr0, t4);
    			append_dev(tr0, td1);
    			append_dev(td1, button1);
    			append_dev(tr0, t6);
    			append_dev(tr0, td2);
    			append_dev(td2, button2);
    			append_dev(tr0, t8);
    			append_dev(tr0, td3);
    			append_dev(td3, button3);
    			append_dev(table, t10);
    			append_dev(table, tr1);
    			append_dev(tr1, td4);
    			append_dev(td4, button4);
    			append_dev(tr1, t12);
    			append_dev(tr1, td5);
    			append_dev(td5, button5);
    			append_dev(tr1, t14);
    			append_dev(tr1, td6);
    			append_dev(td6, button6);
    			append_dev(tr1, t16);
    			append_dev(tr1, td7);
    			append_dev(td7, button7);
    			append_dev(table, t18);
    			append_dev(table, tr2);
    			append_dev(tr2, td8);
    			append_dev(td8, button8);
    			append_dev(tr2, t20);
    			append_dev(tr2, td9);
    			append_dev(td9, button9);
    			append_dev(tr2, t22);
    			append_dev(tr2, td10);
    			append_dev(td10, button10);
    			append_dev(tr2, t24);
    			append_dev(tr2, td11);
    			append_dev(td11, button11);
    			append_dev(table, t26);
    			append_dev(table, tr3);
    			append_dev(tr3, td12);
    			append_dev(td12, button12);
    			append_dev(tr3, t28);
    			append_dev(tr3, td13);
    			append_dev(td13, button13);
    			append_dev(tr3, t30);
    			append_dev(tr3, td14);
    			append_dev(td14, button14);
    			append_dev(table, t32);
    			append_dev(table, tr4);
    			append_dev(tr4, td15);
    			append_dev(td15, button15);
    			append_dev(tr4, t34);
    			append_dev(tr4, td16);
    			append_dev(td16, button16);
    			append_dev(tr4, t36);
    			append_dev(tr4, td17);
    			append_dev(td17, button17);
    			append_dev(body, t38);
    			append_dev(body, script);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
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

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
