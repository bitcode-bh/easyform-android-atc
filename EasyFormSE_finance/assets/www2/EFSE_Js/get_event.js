
function add_event_on_submit() {
    var eve_obj = Type34_Event_Array[0];
    var type_class = eve_obj.type_class;
    var start_time_class = eve_obj.start_time_class;
    var end_time_class = eve_obj.end_time_class;
    var subject_class = eve_obj.subject_class;
    var description_class = eve_obj.description_class;
    var attendee_class = eve_obj.attendee_class;
    var trigger_class = eve_obj.trigger_class;

    if (trigger_class == "" || trigger_class == null || trigger_class == undefined) {
        var event_trigger = "Yes";
    }
    else {
        var event_trigger = get_element_value_by_class(trigger_class);
    }

    var event_type = get_element_value_by_class(type_class);
    var event_start_time = get_element_value_by_class(start_time_class);
    var event_end_time = get_element_value_by_class(end_time_class);
    var event_subject = get_element_value_by_class(subject_class);
    var event_description = get_element_value_by_class(description_class);
    var event_attendee = get_element_value_by_class(attendee_class);

    if (event_trigger == "Yes") {
        // event trigger exist
        loading_hide();
        if (event_type == '' || event_type == null || event_type == undefined) {
            alert("Please fill Event Type!");
        }
        else if (event_start_time == '' || event_start_time == null || event_start_time == undefined) {
            alert("Please fill Event Start Time!");
        }
        else if (event_end_time == '' || event_end_time == null || event_end_time == undefined) {
            alert("Please fill Event End Time!");
        }
        else if (event_subject == '' || event_subject == null || event_subject == undefined) {
            alert("Please fill Event Subject!");
        }
        else if (event_description == '' || event_description == null || event_description == undefined) {
            alert("Please fill Event Description!");
        }
        else if (event_attendee == '' || event_attendee == null || event_attendee == undefined) {
            alert("Please fill Event Attendee!");
        }
        else {

            var email_id = JSON.parse(storage.getItem('email_id'));

            loading();
            var q_jsonobj = [];
            q_jsonobj.push({
                'event_type': event_type,
                'event_start_ms': event_start_time,
                'event_end_ms': event_end_time,
                'event_subject': event_subject,
                'event_description': event_description,
                'event_organizer': email_id,
                'event_attendee': [event_attendee]
            });
            cordova.exec(onsuccess_add_event_on_submit, onfail_add_event_on_submit, 'CalendarEventPlugin', 'anAction', q_jsonobj);
        }
    }
    else {
         // event trigger not exist
        Type34_Event_Array.splice(0, 1);

        var data_json = JSON.parse(storage.getItem('list_json'));
        var list_data = JSON.parse(data_json);
        var survey_mode = list_data[0].survey_mode;
        if (survey_mode == "online") {
            // create task online   (online then offline both)
            insert_online_n_offline_task(0);
        }
        else {
            // create task offline
            get_user_latlong_offline_task();
        }
    }
}

function onsuccess_add_event_on_submit(e) {
    alert("New event has been added!");
    Type34_Event_Array.splice(0, 1);

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var survey_mode = list_data[0].survey_mode;
    if (survey_mode == "online") {
        // create task online   (online then offline both)
        insert_online_n_offline_task(0);
    }
    else {
        // create task offline
        get_user_latlong_offline_task();
    }
}

function onfail_add_event_on_submit(e) {
    alert("Event not added!");
    Type34_Event_Array.splice(0, 1);

    var data_json = JSON.parse(storage.getItem('list_json'));
    var list_data = JSON.parse(data_json);
    var survey_mode = list_data[0].survey_mode;
    if (survey_mode == "online") {
        // create task online   (online then offline both)
        insert_online_n_offline_task(0);
    }
    else {
        // create task offline
        get_user_latlong_offline_task();
    }
}
