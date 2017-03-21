// JavaScript Document


$(document).ready(function(){
    $("#support-btn").click(function(){
				if (!$("#support-btn").hasClass("title-selected")){
					if ($("#main-btn").hasClass("title-selected")){
						$("#main-btn").removeClass("title-selected");
						$("#main").fadeOut("slow");
					} else if ($("#extra-btn").hasClass("title-selected")){
						$("#extra-btn").removeClass("title-selected");
						$("#extra").fadeOut("slow");
					}

					$("#support-btn").addClass("title-selected");
					$("#support").fadeIn("slow");
				}
//        $("#div1").fadeIn();
//        $("#div2").fadeIn("slow");
//        $("#div3").fadeIn(3000);
    });
	$("#main-btn").click(function(){
		if (!$("#main-btn").hasClass("title-selected")){
			if ($("#support-btn").hasClass("title-selected")){
				$("#support-btn").removeClass("title-selected");
				$("#support").fadeOut("slow");
			} else if ($("#extra-btn").hasClass("title-selected")){
				$("#extra-btn").removeClass("title-selected");
				$("#extra").fadeOut("slow");
			}
			
			$("#main-btn").addClass("title-selected");
			$("#main").fadeIn("slow");
		}
//        $("#div1").fadeIn();
//        $("#div2").fadeIn("slow");
//        $("#div3").fadeIn(3000);
    });
	$("#extra-btn").click(function(){
		if (!$("#extra-btn").hasClass("title-selected")){
			if ($("#main-btn").hasClass("title-selected")){
				$("#main-btn").removeClass("title-selected");
				$("#main").fadeOut("slow");
			} else if ($("#support-btn").hasClass("title-selected")){
				$("#support-btn").removeClass("title-selected");
				$("#support").fadeOut("slow");
			}
			
			$("#extra-btn").addClass("title-selected");
			$("#extra").fadeIn("slow");
		}
//        $("#div1").fadeIn();
//        $("#div2").fadeIn("slow");
//        $("#div3").fadeIn(3000);
    });
	
	$("#spotlight-btn").click(function(){
		if (!$("#spotlight-btn").hasClass("title-selected")){
			
			$("#news-btn").removeClass("title-selected");
			$("#news").fadeOut("slow");
			$("#spotlight-btn").addClass("title-selected");
			$("#spotlight").fadeIn("slow");
		}
//        $("#div1").fadeIn();
//        $("#div2").fadeIn("slow");
//        $("#div3").fadeIn(3000);
    });
	
	$("#news-btn").click(function(){
		if (!$("#news-btn").hasClass("title-selected")){
			
			$("#spotlight-btn").removeClass("title-selected");
			$("#spotlight").fadeOut("slow");
			$("#news-btn").addClass("title-selected");
			$("#news").fadeIn("slow");
		}
//        $("#div1").fadeIn();
//        $("#div2").fadeIn("slow");
//        $("#div3").fadeIn(3000);
    });
});

$(function() {
    $('.carousel').each(function(){
        $(this).carousel({
            interval: false
        });
    });
});
