function add_chklist(id) {
    var newItem = $('#new_item_' + id).val();
    if (newItem) {

        var li_str = "";
        li_str += '<li style="border-bottom: 1px solid #ccc;"><label class="label-checkbox item-content" style="height: 30px;width: 94%;min-height: 30px;">'
        li_str += '<input type="checkbox" name="item" value="' + newItem + '">';
        li_str += '<div class="item-media" style="margin-left: -10px;"><i class="icon icon-form-checkbox"></i></div>';
        li_str += '<div class="item-inner" style="margin-left: -6px;top: -8px;"><div class="item-title">' + newItem + '</div></div></label><i class="fa fa-times" style="color: #6d6d6d;font-size: 18px;float: right;margin-top: -23px;" onclick="$(this).parent().remove()"></i></li>';
        $('#items_' + id).append(li_str);

        //$('#items_' + id).append('<li style="border-bottom: 1px solid #ccc;padding: 1px 0;height: 30px;"><input type="checkbox" name="item" value="' + newItem + '" style="display: inline-block;width: 10%;margin-top: 4px;height: 18px;"><label for="item" style="display: inline-block;width: 80%;height: 25px;vertical-align: bottom;">' + newItem + '</label><i class="fa fa-times" style="color: gray;position: absolute;font-size: 18px;margin: 4px 7px;" onclick="$(this).parent().remove()"></i></li>');
        $('#new_item_' + id).val('');
    }
}



function add_chklist_event(event, id) {
    if (event.keyCode === 13) {
        //enter button press
        add_chklist(id);
    }
}