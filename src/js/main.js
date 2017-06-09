'use strict';

window.onload = function(){

	const box = document.querySelector('.box');
	const children = box.querySelectorAll('.child');

	[].map.apply(children,[function(obj, idx){

		let index = idx;

		obj.onclick = function(e){
			console.log(e);
			alert(index);
		};

	}]);

};