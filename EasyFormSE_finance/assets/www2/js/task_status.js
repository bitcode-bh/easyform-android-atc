/* Shared status labels/colours. Each reader owns its request and destination state. */
(function (w) {
    'use strict';
    if (w.AppTaskStatus) return;
    function create(services, state, ready, notify) {
        var pending = null, generation = 0;
        function cancel() {
            generation++;
            var request = pending; pending = null;
            if (request && typeof request.cancel === 'function') request.cancel();
        }
        function load(page) {
            cancel();
            var version = generation, completed = false;
            function current() { return !completed && version === generation; }
            function finish() {
                if (!current()) return;
                completed = true; pending = null; ready(page);
            }
            try {
                var company = JSON.parse(services.storage.getItem('company_id'));
                var flow = JSON.parse(services.storage.getItem('wayflow'));
                var url = JSON.parse(services.storage.getItem('global_wcf_url'));
                if (company === null || company === undefined || company === '' || flow === null || flow === undefined || !url) {
                    throw new Error('Missing task status context');
                }
                var data = [{ Company_id: String(company).replace(/"/g, ''), Flow_id: flow, Flag: 'get_data' }];
                var request = new services.request(url + 'WCF_Get_ddl_Data', JSON.stringify(data), function (response) {
                    if (!current()) return;
                    try {
                        var result = JSON.parse(response.responseText)[0];
                        if (result.status == 1) {
                            var rows = JSON.parse(result.data)[0].FSM_Data;
                            if (!Array.isArray(rows)) throw new Error('Invalid task status data');
                            var ids = [], names = [], colors = [], textColors = [];
                            rows.forEach(function (row) {
                                ids[row.Status_Name] = row.Status;
                                names[row.Status] = row.Status_Name;
                                colors[row.Status_Name] = row.color == '' || row.color === null || row.color === undefined ? 'gray' : row.color;
                                textColors[row.Status_Name] = row.text_color;
                            });
                            state.glob_statusId_ary = ids; state.glob_statusName_ary = names;
                            state.glob_statusColor_ary = colors; state.glob_textColor_ary = textColors;
                        } else if (notify) notify(result.message);
                    } catch (error) { w.console.error('Unable to read task status labels'); }
                    finish();
                }, function () { finish(); });
                if (!completed) { pending = request; request.callOtherDomain(); }
                return request;
            } catch (error) {
                w.console.error('Unable to load task status labels'); finish();
            }
        }
        return { load: load, cancel: cancel };
    }
    w.AppTaskStatus = { create: create };
})(window);
