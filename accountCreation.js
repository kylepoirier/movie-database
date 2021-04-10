function submit(){
    console.log("Submitted");
	let classes= "cardClass="+document.getElementById("class").value;
	let rarity="rarity="+ document.getElementById("rarity").value;
	let para = classes+"&"+rarity;
    console.log(classes);
	let req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
			console.log("Cards Searched");
		}
	}
	
	req.open("GET", '/cards?'+para);
	req.setRequestHeader("Content-Type", "application/json");
	console.log(classes);
	req.send();  
}