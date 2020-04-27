<script>

	import Display from './Display.svelte';
	let view = '';


	async function calculate() {
		const options =  {
			method: "POST",
			headers: new Headers({
				'content-type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}),
			body : JSON.stringify({
				calculation: view
			})
		}	
		const response = await fetch("http://localhost:8081/calculate", options);
		const todo = await response.json();
	
		if (response.ok) {
			return todo.result;
		} else {
			throw new Error(todo);
		}
	}

	async function store() {
		const options =  {
			method: "POST",
			headers: new Headers({
				'content-type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}),
			body : JSON.stringify({
				store: view
			})
		}	
		const response = await fetch("http://localhost:8081/store", options);
	}

	async function call() {
		const options =  {
			method: "GET",
			headers: new Headers({
				'content-type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}),
		}	
		const response = await fetch("http://localhost:8081/store", options);
		const callValue = await response.json();

		if (response.ok) {
			return callValue.result;
		} else {
			throw new Error(callValue);
		}
	}

	function insert(num){
		view = view+num;
	}

	function clean(){
		view="";
	}

	function back(){
		if(view.length > 0) {
			view = view.substring(0,view.length-1);
		}		
	}

	function handleEqual(e) {
		calculate().then( (response) => {
			view = response;
		}).catch( (error) => {
			alert(error.message);
		});
	}

	function storeValue(e) {
		store().then( (response) => {
			const storeValue = view;
			if(view != "") {
				alert("Der Wert "+view+" wurde gespeichert.");
			}
			else {
				storeValue = "";
				alert("Der Store ist leer.");
			}

		}).catch( (error) => {
			alert(error.message);
		});
	}
	
	function callValue() {
		call().then( (response) => {
			if(checkString(view)) {
				view = view + response;
			}
			else {
				view = response;
			}
		}).catch( (error) => {
			alert(error.message);
		});
	}

	function checkString(string) {
		let check = string.substring(string.length-1);

		if (isNaN(check)) {
			return true;
		}
		else {
			return false;
		}
	}
</script>

<main>
	<h1 class="headline">Taschenrechner</h1>

	<div class="grid-container">
		
		<Display display={view}></Display>
	<br/>
  		<button class="button" on:click={() => insert("7")} id="first">7</button>
  		<button class="button" on:click={() => insert("8")} id="second">8</button>
  		<button class="button" on:click={() => insert("9")} id="third">9</button>
  		<button class="operator button" on:click={() => insert("+")} id="fourth">+</button>

  		<button class="button" on:click={() => insert("4")} id="first">4</button>
  		<button class="button" on:click={() => insert("5")} id="second">5</button>
  		<button class="button" on:click={() => insert("6")} id="third">6</button>
  		<button class="operator button" on:click={() => insert("-")} id="fourth">-</button>

  		<button class="button" on:click={() => insert("1")} id="first">1</button>
  		<button class="button" on:click={() => insert("2")} id="second">2</button>
  		<button class="button" on:click={() => insert("3")} id="third">3</button>
  		<button class="operator button" on:click={() => insert("/")} id="fourth">/</button>

  		<button class="button" on:click={() => insert(".")} id="first">.</button>
  		<button class="button" on:click={() => insert("0")} id="colspan">0</button>
  		<button class="operator button" on:click={() => insert("*")} id="fourth">*</button>

		<button class="button" on:click={() => clean()} id="first" style="background-color: #D21906; color: white;">clear</button>
  		<button class="button" on:click={handleEqual} id="colspan" style="background-color: #A4A620;">=</button>
  		<button class="button"on:click={() => back()} style="background-color: #FF7C12;" id="fourth">&#9664</button>

		<button class="button"on:click={() => storeValue()} id="store" style="background-color: #81DAF5;">store &#128427</button>
		<button class="button"on:click={() => callValue()} id="call" style="background-color: #3104B4;">query &#128449</button>
</div>

</main>

<style>
    main{
		width: 100%;
		height: 100%;
        background: black;
    }
	.grid-container {
  		display: grid;
		padding: 2em;
		grid-template-columns: 5em 0.5em 5em 0.5em 5em 0.5em 5em;
		grid-template-rows: 5.5em 1.5em 4em 4em 4em 4em 4em 4em;
  		background-color: #4E4E4E;
		border: 2px solid white;
		border-radius: 7px;
		position:absolute;
		align-items: center;
		top:50%;
		left:50%;
    	transform: translate(-50%,-50%);
	}
	.headline {
		color: white;
		font-family: "Arial Black", Gadget, sans-serif;
		letter-spacing: 0.1em;
		position:absolute;
		top:40px;
		left:50%;
		transform: translate(-50%,-50%);
	}
	.button {
		border: 0.08em solid black;
		color: black;
		width: 5em;
		height: 3.4em;
		background-color: rgba(255, 255, 255, 0.816);
	}
	.operator {
		background-color: #FFD0D9;
		border: 0.08em solid black;
		color: black;
		height: 3.4em;
	}
	.button:hover{
		font-weight: bold;
		filter: brightness(85%);
	}
	.button:active {
	  	transform: translateY(2px);
	}
	#first {
		grid-column-start: 1;
	}
	#second {
		grid-column-start: 3;
	}
	#third {
		grid-column-start: 5;
	}
	#fourth {
		grid-column-start: 7;
	}
	#colspan {
  		grid-column-start: 3;
  		grid-column-end: 5;
		width: 10.5em;
	}
	#store {
		grid-column-start: 1;
  		grid-column-end: 3;
		width: 10.5em;
	}
	#call {
		grid-column-start: 5;
  		grid-column-end: 7;
		color: white;
		width: 10.5em;
	}
	
</style>