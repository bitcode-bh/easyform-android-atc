package com.sky.atc.easyformse.camera;

import org.junit.Test;
import static org.junit.Assert.*;

public class CameraGeometryTest {
    @Test public void fitsWithoutDistortionAcrossViewportsAndRotations() {
        int[][] views={{1220,2712},{2712,1220},{320,480},{480,320},{600,600}};
        int[][] streams={{1920,1080},{1600,1200},{640,480}};
        for(int[] view:views) for(int[] stream:streams) for(int rotation:new int[]{0,90,180,270}) {
            int[] fit=CameraGeometry.fit(view[0],view[1],stream[0],stream[1],rotation);
            assertTrue(fit[0]<=view[0] && fit[1]<=view[1]);
            double aspect=rotation%180==0?(double)stream[0]/stream[1]:(double)stream[1]/stream[0];
            assertEquals(aspect,(double)fit[0]/fit[1],0.01);
        }
    }
    @Test public void compensatesOnlyForUnmirroredLegacyFrontPreview() {
        assertFalse(CameraGeometry.needsLegacyFlip(true,true));
        assertTrue(CameraGeometry.needsLegacyFlip(true,false));
        assertFalse(CameraGeometry.needsLegacyFlip(false,true));
        assertFalse(CameraGeometry.needsLegacyFlip(false,false));
    }
    @Test public void handlesBothSensorOrientationsAndFacingDirections() {
        assertEquals(270,CameraGeometry.previewRotation(90,0,true));
        assertEquals(90,CameraGeometry.previewRotation(90,0,false));
        assertEquals(0,CameraGeometry.previewRotation(90,90,false));
        assertEquals(0,CameraGeometry.jpegRotation(90,90,true));
        assertEquals(180,CameraGeometry.jpegRotation(90,90,false));
        assertEquals(180,CameraGeometry.jpegRotation(270,90,true));
        assertEquals(0,CameraGeometry.jpegRotation(270,90,false));
    }
}
