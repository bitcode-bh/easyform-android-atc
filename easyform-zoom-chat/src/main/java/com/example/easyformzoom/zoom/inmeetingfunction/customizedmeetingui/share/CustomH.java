package com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.share;




public final class CustomH {
    private CustomListenerA a;
    private static CustomH b = null;

    private CustomH() {
    }

    public static synchronized CustomH a() {
        if (b == null) {
            b = new CustomH();
        }

        return b;
    }

    final void a(CustomListenerA var1) {
        this.a = var1;
    }

    static synchronized void b() {
        b = null;
    }

    public final boolean c() {
        if (this.a == null) {
            return false;
        } else {
            this.a.startAnnotation();
            return true;
        }
    }

    public final boolean d() {
        if (this.a == null) {
            return false;
        } else {
            this.a.stopAnnotation();
            return true;
        }
    }

    public final boolean a(int var1) {
        if (this.a == null) {
            return false;
        } else {
            this.a.setToolWidth(var1, true);
            return true;
        }
    }

    public final boolean b(int var1) {
        if (this.a == null) {
            return false;
        } else {
            this.a.setToolColor(var1);
            return true;
        }
    }
/*
    public final boolean a(AnnoToolType var1) {
        if (this.a == null) {
            return false;
        } else {
            this.a.setCurAnnoTool(var1);
            return true;
        }
    }*/

    public final boolean e() {
        if (this.a == null) {
            return false;
        } else {
            this.a.redo();
            return true;
        }
    }

    public final boolean f() {
        if (this.a == null) {
            return false;
        } else {
            this.a.undo();
            return true;
        }
    }

    public final boolean g() {
        if (this.a == null) {
            return false;
        } else {
            this.a.eraseAll();
            return true;
        }
    }

    public final boolean CustomH() {
        return this.a == null ? false : this.a.isPresenter();
    }
}
