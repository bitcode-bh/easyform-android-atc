package com.example.easyformzoom.zoom.inmeetingfunction.customizedmeetingui.share;

/*import com.zipow.annotate.AnnoToolType;*/

public interface CustomListenerA {
    void startAnnotation();

    void stopAnnotation();

    void setToolWidth(int var1, boolean var2);

    /*void setCurAnnoTool(AnnoToolType var1);*/

    void setToolColor(int var1);

    void redo();

    void undo();

    void eraseAll();

    boolean isPresenter();
}
