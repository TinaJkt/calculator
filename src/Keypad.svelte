<style>
    body{
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
	.input {
		grid-column-start: 1;
  		grid-column-end: 5;
		width: 100%;
  		position: relative;
  		margin: 30px auto;
		margin-bottom: 50px;
  		font-size: 20px;
		font-family: Arial, Helvetica, sans-serif;
		font-weight: bold;
		letter-spacing: 0.1em;
  		padding: 10px;
  		background-color: #323232;
		border: 2px solid black;
		height: 3em;
		color: white;
		box-shadow: 1px 1px 10px 2px black inset;
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

<body>
	<h1 class="headline">Taschenrechner</h1>

	<div class="grid-container">
		

		<input class="input" type="text" name="textview" disabled/>
		
	
  		<button class="button" onclick="insert(7)">7</button>
  		<button class="button" onclick="insert(8)">8</button>
  		<button class="button" onclick="insert(9)">9</button>
  		<button class="operator button" onclick="insert('+')">+</button>

  		<button class="button" onclick="insert(4)">4</button>
  		<button class="button" onclick="insert(5)">5</button>
  		<button class="button" onclick="insert(6)">6</button>
  		<button class="operator button" onclick="insert('-')">-</button>

  		<button class="button" onclick="insert(1)">1</button>
  		<button class="button" onclick="insert(2)">2</button>
  		<button class="button" onclick="insert(3)">3</button>
  		<button class="operator button" onclick="insert('/')">/</button>

  		<button class="button" onclick="insert('.')">.</button>
  		<button class="button" onclick="insert(0)" id="colspan">0</button>
  		<button class="operator button" onclick="insert('*')">*</button>

		<button class="button" onclick="clean()" style="background-color: #D21906; color: white;">clear</button>
  		<button class="button" onclick="equal()" id="colspan" style="background-color: #A4A620;">=</button>
  		<button class="button" onclick="back()" style="background-color: #FF7C12;">&#9664</button>
</div>

	<script>
		function insert(num){
    		document.form.textview.value = document.form.textview.value+num;
		}
    	function equal(){
        	var exp = document.form.textview.value;
        	document.form.textview.value = eval(exp);
    	}
    	function clean(){
        	document.form.textview.value = "";
    	}
    	function back(){
        	var exp = document.form.textview.value;
        	if(exp){
            	document.form.textview.value = exp.substring(0,exp.length-1);
        	}
    	}
	</script>    
</body>

<form action="" name="form"></form>