
get_weather_detail = (t_lat, t_long) => {


    let request = $.get({
        url: 'https://api.openweathermap.org/data/2.5/weather?lat=' + t_lat + '&lon=' + t_long + '&appid=751d80f6c314139192ffcb62c107e654', success(data) {
            var result = data;
            var data_str = result;

            var weather_mode = data_str.weather[0]['description']
            var country = data_str.sys.country;

            var temp = data_str.main.temp;
            var tempKelvin = temp; // Example temperature
            var celsius = kelvinToCelsius(tempKelvin).toFixed(0);
            temp = celsius + "\u00B0"

            var dt = data_str.dt;
            var date = new Date(dt * 1000); // Convert to milliseconds
            let t_default_val = convert_datetime_by_format(date, 'datetime');

            var weather_icon = data_str.weather[0]['icon'];
            var city_name = data_str.name;

            // visibility convert meter to kilometer
            var visibility = data_str.visibility;
            visibility = visibility / 1000;

            var feels_like = data_str.main.feels_like;
            feels_like = kelvinToCelsius(feels_like).toFixed(0);
            feels_like = feels_like + "\u00B0"

            let weather_Array = [];
            weather_Array.push({
                weather: data_str.weather[0].description,
                temp: data_str.main.temp,
                temp_min: data_str.main.temp_min,
                temp_max: data_str.main.temp_max,
                humidity: data_str.main.humidity,
                visibility: data_str.visibility,
                sunrise: data_str.sys.sunrise,
                sunset: data_str.sys.sunset,
                name: data_str.name,
                wind: data_str.wind.speed
            })

            $("#hdn_weather_card_view").val(encodeURIComponent(JSON.stringify(weather_Array)))

            $("#weather_card_view").show();
            $("#weather_tbl #weather_type").html("");
            $("#weather_tbl #weather_con").html("");
            $("#weather_tbl #weather_temp").html("");
            $("#weather_tbl #weather_time").html("");

            var img_str = "images/Weather_icons/" + weather_icon + ".png"

            $("#weather_tbl #weather_icon").html('<img src=' + img_str + ' style="width:60px;" />')
            $("#weather_tbl #weather_type").html(weather_mode);
            //$("#weather_tbl #weather_con").html(city_name);
            $("#weather_tbl #weather_temp").html(temp);
            $("#weather_tbl #weather_time").html(t_default_val);
            $("#weather_tbl #weather_feels").html('Feels like ' + feels_like);
            $("#weather_tbl #weather_vis").html('Visibility ' + visibility + ' KM');

            let lat = data.coord.lat;
            let lon = data.coord.lon;
            var request;
            request = $.get({
                url: global_wcf_url + `LocationApi/aws/${lat}/${lon}`, success(data) {
                    let address = data.display_name;
                    let area = address.split(',')[0];
                    $("#weather_tbl #weather_con").html(area);
                }
            });
        }
    });

}

function kelvinToCelsius(kelvin) {
    return kelvin - 273.15;
}

