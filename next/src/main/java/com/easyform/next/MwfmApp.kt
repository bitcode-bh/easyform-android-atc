package com.easyform.next

import android.app.Application
import com.easyform.next.data.auth.AuthRepository
import com.easyform.next.data.auth.SessionStore
import com.easyform.next.data.flow.FlowDb
import com.easyform.next.data.flow.FlowRepository
import com.easyform.next.data.form.FormRepository
import com.easyform.next.data.net.Api

/** The few shared objects of the app, made once. (A dependency-injection library comes when there is more to wire.) */
class MwfmApp : Application() {
    lateinit var container: Container
        private set

    override fun onCreate() {
        super.onCreate()
        val sessions = SessionStore(this)
        val api = Api()
        val db = FlowDb(this)
        container = Container(sessions, api, AuthRepository(this, api, sessions), FlowRepository(api, db), FormRepository(db))
    }

    class Container(val sessions: SessionStore, val api: Api, val auth: AuthRepository, val flows: FlowRepository, val forms: FormRepository)
}
