<style>
    body{
        background: black;
    }
	.calculator {
		display: block;
		height: 490px;
		width: 400px;
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
	.operator {
		background-color: #FFD0D9;
	}
	button {
		margin: 0;
		border: 0.08em solid black;
		color: black;
		width: 5em;
		height: 3.4em;
		background-color: rgba(255, 255, 255, 0.816);	
	}
	button:hover {
		font-weight: bold;
		filter: brightness(85%);
	}
	button:active {
	  	transform: translateY(2px);
	}
    .input {
  		position: relative;
  		display: block;
  		width: 89%;
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
</style>


<body>
<h1 class="headline">Taschenrechner</h1>
   	<div class="calculator">
		<form action="" name="form">
			<input class="input" type ="text" name="textview" disabled/>
		</form>
	    <table style="margin: 0 auto;">
            <tr>
			    <td><button style="margin-bottom: 0.5em; margin-right: 0.5em;" onclick="insert(7)">7</button></td>
                <td><button style="margin-bottom: 0.5em; margin-right: 0.5em;" onclick="insert(8)">8</button></td>
                <td><button style="margin-bottom: 0.5em; margin-right: 0.5em;" onclick="insert(9)">9</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert('+')" class="operator">+</button></td>
            </tr>
			<tr>
                <td><button style="margin-bottom: 0.5em;" onclick="insert(4)">4</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert(5)">5</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert(6)">6</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert('-')" class="operator">-</button></td>
            </tr>
            <tr>
                <td><button style="margin-bottom: 0.5em;" onclick="insert(1)">1</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert(2)">2</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert(3)">3</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert('/')" class="operator">/</button></td>
            </tr>
            <tr>
                <td><button style="margin-bottom: 0.5em;" onclick="insert('.')">.</button></td>
                <td colspan="2"><button style="width:172px; margin-bottom: 0.5em;" onclick="insert(0)">0</button></td>
                <td><button style="margin-bottom: 0.5em;" onclick="insert('*')" class="operator">*</button></td>
            </tr>
            <tr>          
				<td><button style="background-color: #D21906; color: white; margin-bottom: 0.5em;" onclick="clean()">clear</button></td>
				<td colspan="2"><button style="background-color: #A4A620; width:172px; margin-bottom: 0.5em;" onclick="equal()">=</button></td>
                <td><button style="margin-bottom: 0.5em; background-color: #FF7C12;" onclick="back()">&#9664</button></td>
            </tr>
		</table>
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