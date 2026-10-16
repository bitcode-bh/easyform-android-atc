package com.sky.atc.easyformse.annotation;
import org.junit.Test;
import static org.junit.Assert.*;
public class AnnotationDocumentTest {
    private void stroke(AnnotationDocument doc, boolean erase) { doc.stroke(erase, 0xffff0000, .01f, new float[]{.1f,.2f,.8f,.9f}); }
    @Test public void drawEraseClearUndoRedoPreserveSequence() {
        AnnotationDocument doc = new AnnotationDocument(); stroke(doc,false); stroke(doc,true); doc.clear();
        assertEquals(3,doc.snapshot().size()); assertTrue(doc.snapshot().get(2).clear);
        doc.undo(); assertEquals(2,doc.snapshot().size()); assertTrue(doc.snapshot().get(1).erase);
        doc.undo(); assertEquals(1,doc.snapshot().size()); doc.redo(); doc.redo(); assertTrue(doc.snapshot().get(2).clear);
    }
    @Test public void branchDropsRedoWithoutChangingSavedSnapshot() {
        AnnotationDocument doc = new AnnotationDocument(); stroke(doc,false); java.util.List<AnnotationDocument.Command> saved = doc.snapshot();
        stroke(doc,true); doc.undo(); doc.clear(); assertFalse(doc.canRedo()); assertEquals(1,saved.size()); assertFalse(saved.get(0).clear);
    }
    @Test public void pointsAreImmutableAndHistoryEmptyBoundsAreSafe() {
        AnnotationDocument doc = new AnnotationDocument(); float[] points = {.1f,.2f}; doc.stroke(false,0,.01f,points); points[0]=.9f;
        float[] copy=doc.snapshot().get(0).points(); copy[0]=.7f; assertEquals(.1f,doc.snapshot().get(0).points()[0],0);
        doc.undo(); doc.undo(); assertFalse(doc.canUndo()); assertFalse(doc.isDirty()); doc.redo(); doc.redo(); assertEquals(1,doc.snapshot().size());
    }
    @Test(expected=IllegalArgumentException.class) public void rejectsZeroThickness() { new AnnotationDocument().stroke(false,0,0,new float[]{0,0}); }
    @Test(expected=IllegalArgumentException.class) public void rejectsInvalidCoordinate() { new AnnotationDocument().stroke(false,0,.01f,new float[]{Float.NaN,0}); }
    @Test public void fitCentersPortraitLandscapeSquareAndPanorama() {
        int[][] sizes={{1200,1800},{1800,1200},{1200,1200},{6000,400}};
        for(int[] size:sizes) {
            ImageGeometry fit=ImageGeometry.fit(size[0],size[1],400,800);
            assertTrue(size[0]*fit.scale<=400.001); assertTrue(size[1]*fit.scale<=800.001);
            assertEquals(200,fit.x+size[0]*fit.scale/2,.001); assertEquals(400,fit.y+size[1]*fit.scale/2,.001);
            float normalized=ImageGeometry.normalized((123-fit.x)/fit.scale,size[0]);
            assertEquals(Math.max(0,Math.min(size[0],(123-fit.x)/fit.scale)),normalized*size[0],.001);
        }
    }
    @Test public void normalizedCoordinatesRetainExportPlacementAcrossResolutions() {
        float point=ImageGeometry.normalized(256,1024); assertEquals(1024,point*4096,0);
        assertEquals(0,ImageGeometry.normalized(-1,1024),0); assertEquals(1,ImageGeometry.normalized(2000,1024),0);
    }
    @Test(expected=IllegalArgumentException.class) public void invalidImageHasNoFit() { ImageGeometry.fit(0,100,400,800); }
}
