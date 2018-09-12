{% load staticfiles %}

<html lang="en">
	<head>
		<meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
        <title>TweetMap</title>

        <!-- Bootstrap -->
        <link href="{% static 'css/bootstrap.min.css' %}" rel="stylesheet">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">

        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>

        <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
        <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
        <!--[if lt IE 9]>
          <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
          <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->


		<style>
          /* Always set the map height explicitly to define the size of the div
           * element that contains the map. */
          #map {
            height: 100%;
          }
          /* Optional: Makes the sample page fill the window. */
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
        </style>
	</head>

	<body>
		<nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
            <div class="container">
                <!-- Brand and toggle get grouped for better mobile display -->
                <div class="navbar-header">
                    <a class="navbar-brand">TweetMap</a>
                </div>
                <!-- Collect the nav links, forms, and other content for toggling -->
                <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul class="nav navbar-nav">
                        <li>
							<form class="navbar-form navbar-left" role="search" action="/TwittMapApp/tweet/" method="POST"> {% csrf_token %}
								<input type="text" class="form-control" placeholder="Search" name="myword" id="myword">
								<button class="btn btn-default" type="submit">
                                    <i class="glyphicon glyphicon-search"></i>
                                  </button>
							</form>


						</li>

                    </ul>
                </div>
                <!-- /.navbar-collapse -->
            </div>
            <!-- /.container -->
        </nav>

		<div id="map"></div>

        <script>
          var map;
          function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
              center: {lat: 53.4129, lng: 8.2439},
              zoom: 3
            });

		if ({{my_data |safe}}) {
			var data_from_django = {{ my_data |safe }};
			console.log("thi");
			//alert(data_from_django.mytweets.length)
			total_tweets = data_from_django.mytweets;
			var data = [];
			//alert(total_tweets.length);
			if(total_tweets.length == 0)
			{
			    alert("No Tweets Found");
			}
			else{
			    for (var i = 0; i < total_tweets.length; i++) {
				    var res = total_tweets[i];
				    data[i] = "<strong>Tweet:</strong><br>" +
					res._source.message + "<br><strong>Author:</strong><br>" + res._source.author +
					"<br><strong>Location:</strong><br>" + res._source.location +
					"<br><strong>Tweet Creation Timestamp:</strong><br>" + res._source.date;
					var marker = new google.maps.Marker({
					    position:{
						lat:res._source.lat,
						lng:res._source.lng
					    },
					    map: map
					//icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAA1BMVEVoqy3pkp4VAAAADElEQVQImWNgoCcAAABuAAEdQFfVAAAAAElFTkSuQmCC"
					 });
					var infowindow = new google.maps.InfoWindow();
					google.maps.event.addListener(marker, 'click', (function(marker, i) {
						return function() {
						    infowindow.setContent(data[i]);
						    infowindow.open(map, marker);
						}
					    })(marker, i));
                    		}
                   	}
             	}

          }
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap"
        async defer></script>
	</body>
</html>
