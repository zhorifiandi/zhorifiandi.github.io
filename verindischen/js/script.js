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
});