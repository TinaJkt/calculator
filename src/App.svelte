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
</script>

<main>
	<h1 class="headline">Taschenrechner</h1>

	<div class="grid-container">
		
		<Display display={view}/>
	
  		<button class="button" on:click={() => insert("7")}>7</button>
  		<button class="button" on:click={() => insert("8")}>8</button>
  		<button class="button" on:click={() => insert("9")}>9</button>
  		<button class="operator button" on:click={() => insert("+")}>+</button>

  		<button class="button" on:click={() => insert("4")}>4</button>
  		<button class="button" on:click={() => insert("5")}>5</button>
  		<button class="button" on:click={() => insert("6")}>6</button>
  		<button class="operator button" on:click={() => insert("-")}>-</button>

  		<button class="button" on:click={() => insert("1")}>1</button>
  		<button class="button" on:click={() => insert("2")}>2</button>
  		<button class="button" on:click={() => insert("3")}>3</button>
  		<button class="operator button" on:click={() => insert("/")}>/</button>

  		<button class="button" on:click={() => insert(".")}>.</button>
  		<button class="button" on:click={() => insert("0")} id="colspan">0</button>
  		<button class="operator button" on:click={() => insert("*")}>*</button>

		<button class="button" on:click={() => clean()} style="background-color: #D21906; color: white;">clear</button>
  		<button class="button" on:click={handleEqual} id="colspan" style="background-color: #A4A620;">=</button>
  		<button class="button"on:click={() => back()} style="background-color: #FF7C12;">&#9664</button>
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
		height: 490px;
		width: 400px;
		grid-template-columns: 5em 5em 5em 5em;
  		background-color: #4E4E4E;
		border: 2px solid white;
		border-radius: 7px;
		position:absolute;
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
		margin-left: 10px;
		margin-bottom: 0.5em;
		width: 5em;
		height: 3.4em;
		background-color: rgba(255, 255, 255, 0.816);
	}
	.operator {
		background-color: #FFD0D9;
		margin-bottom: 0.5em;
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
	#colspan {
  		grid-column-start: 2;
  		grid-column-end: 4;
		width: 172px;
	}

</style>