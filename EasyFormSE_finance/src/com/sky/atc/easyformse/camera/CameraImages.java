package com.sky.atc.easyformse.camera;
import android.graphics.*;
import androidx.exifinterface.media.ExifInterface;
import java.io.*;
public final class CameraImages {
    private CameraImages() {}
    public static Bitmap orient(Bitmap bitmap, File file) throws IOException {
        if (bitmap == null) throw new IOException("Image decode failed");
        bitmap.setDensity(Bitmap.DENSITY_NONE);
        int orientation = new ExifInterface(file).getAttributeInt(ExifInterface.TAG_ORIENTATION,1);
        Matrix matrix = new Matrix();
        switch(orientation) {
            case 2: matrix.setScale(-1,1); break;
            case 3: matrix.setRotate(180); break;
            case 4: matrix.setScale(1,-1); break;
            case 5: matrix.setRotate(90); matrix.postScale(-1,1); break;
            case 6: matrix.setRotate(90); break;
            case 7: matrix.setRotate(270); matrix.postScale(-1,1); break;
            case 8: matrix.setRotate(270); break;
        }
        if(matrix.isIdentity()) return bitmap;
        Bitmap output=Bitmap.createBitmap(bitmap,0,0,bitmap.getWidth(),bitmap.getHeight(),matrix,true);
        if(output!=bitmap) bitmap.recycle(); return output;
    }
    public static void mirrorFile(File file) throws IOException {
        Bitmap upright=null, mirrored=null; File temp=null;
        try {
            upright=orient(BitmapFactory.decodeFile(file.getPath()),file);
            Matrix matrix=new Matrix(); matrix.setScale(-1,1);
            mirrored=Bitmap.createBitmap(upright,0,0,upright.getWidth(),upright.getHeight(),matrix,true);
            temp=File.createTempFile("mirror-", ".jpg", file.getParentFile());
            try(OutputStream output=new FileOutputStream(temp)) { if(!mirrored.compress(Bitmap.CompressFormat.JPEG,100,output)) throw new IOException("Unable to mirror photo"); }
            if(!temp.renameTo(file)) throw new IOException("Unable to save mirrored photo");
        } finally { if(temp!=null && temp.exists()) temp.delete(); if(mirrored!=null && mirrored!=upright) mirrored.recycle(); if(upright!=null) upright.recycle(); }
    }
}
