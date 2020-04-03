<script>
    export let display = '';
    
</script>

<input value={display} class="input" type="text" name="textview" disabled/>

<style>
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
</style>