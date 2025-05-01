window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-W6TKFE4L7H');

function share(){
	navigator.share({
		title: document.title,
		url: window.location.href
	});
}

if (window.location.hostname === "huroof.web.app"){

    window.location.href = window.location.href.replace("huroof.web.app", "huroof.app");
}

$(".site-header, .site-header *").on("click", function(event){

	console.log(".site-header click");
	
	event.stopPropagation();
});