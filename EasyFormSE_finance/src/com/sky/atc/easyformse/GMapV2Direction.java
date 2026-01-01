package com.sky.atc.easyformse;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.StringTokenizer;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;
import org.json.JSONArray;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import android.os.StrictMode;
import android.util.Log;

import com.google.android.gms.maps.model.LatLng;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//to get shortest path from server API
//right now it not in use moved to server side
@StringFogIgnore
public class GMapV2Direction {
	public final static String MODE_DRIVING = "driving";
	public final static String MODE_WALKING = "walking";
	private static final String PATHURL = sqlitewraper.context.getResources().getString(R.string.PATHURL);


	public GMapV2Direction() {
	}

    public static ArrayList getDocument(LatLng start, LatLng end, String param,
                                        String mode, String point) {
        ArrayList<LatLng> listGeopoints1 = new ArrayList<>();
        String url = null;
        if (point.equalsIgnoreCase("NA")) {
//            url = "http://maps.googleapis.com/maps/api/directions/xml?"
//                    + "origin=" + start.latitude + "," + start.longitude
//                    + "&destination=" + end.latitude + "," + end.longitude
//                    + "&sensor=false&units=metric&mode=" + mode;
            url = PATHURL + start.longitude + "," + start.latitude + ";" + end.longitude + "," + end.latitude + "?steps=false&geometries=geojson&overview=full";

		} else {

//			url = "http://maps.googleapis.com/maps/api/directions/xml?"
//					+ "origin=" + start.latitude + "," + start.longitude
//					+ "&destination=" + end.latitude + "," + end.longitude
//					+ "&waypoints=" + param
//					+ "&sensor=false&units=metric&mode=" + mode;

            url = PATHURL + start.longitude + "," + start.latitude + ";" + end.longitude + "," + end.latitude + "?steps=false&geometries=geojson&overview=full";

        }
        try {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                    .permitAll().build();
            StrictMode.setThreadPolicy(policy);
            HttpClient httpClient = new DefaultHttpClient();
            HttpContext localContext = new BasicHttpContext();
            HttpPost httpPost = new HttpPost(url);
            HttpResponse response = httpClient.execute(httpPost, localContext);

            String jsonResponse = new BasicResponseHandler().handleResponse(response);

            JSONObject jsonObj = new JSONObject(jsonResponse);

            // Getting JSON Array node
            JSONArray routes = jsonObj.getJSONArray("routes");
            //test

            JSONObject jsonObject = routes.getJSONObject(0);

            JSONObject geometry = jsonObject.getJSONObject("geometry");

            JSONArray coordinates = geometry.getJSONArray("coordinates");

            JSONArray di_n = new JSONArray();
            JSONObject jObjd = new JSONObject();


            for (int i = 0; i < coordinates.length(); i++) {
                String  c = coordinates.getString(i);

//                String[] separated = c.split(",");
//                separated[0];
//                separated[1];

                StringTokenizer tokens = new StringTokenizer(c, ",");
                String first = tokens.nextToken();// this will contain "Fruit"
                String second = tokens.nextToken();

                if(first.contains("[")){
                    first=first.replace("[","");
                }
                if(second.contains("]")){
                    second=second.replace("]","");
                }
                double lng = Double.parseDouble(first);
                double lat = Double.parseDouble(second);



                listGeopoints1.add(new LatLng(lat, lng));

//                for (int i1 = 0; i1 < c.length(); i1++) {
//                    String hel5 = c.getString(i1);
//                    Log.d("##value", hel5);

//
//                    double lat = 0;
//                    double lng = 0;

//                    for (int j = 0; j < c.length(); j++) {
//                        try {
//                            if (j == 0) {
//
//                                listGeopoints1.add(new LatLng(lat, lng));
//                            }
//                            if (j > 0) {
//
//
//                                listGeopoints1.add(new LatLng(lat, lng));
////                                jObjd.put("lat", hel5);
////                                di_n.put(jObjd);
//                            }
//                        } catch (Exception e) {
//                            e.printStackTrace();
//                        }
//                    }


//                        try {
//
//                            if (i1 == 0) {
////                                jObjd.put("lat", s_lat);
////                                jObjd.put("lng", s_lon);
////                                di_n.put(jObjd);
//                                jObjd.put("lng", hel5);
//                                di_n.put(jObjd);
//
//                            } else if (i1 > 0) {
//                                jObjd.put("lat",
//                                        String.valueOf(directionPoint
//                                                .get(i1).latitude));
//                                jObjd.put("lng",
//                                        String.valueOf(directionPoint
//                                                .get(i1).longitude));
//                                di_n.put(jObjd);
//
//                                jObjd.put("lat", hel5);
//                                di_n.put(jObjd);
//                            }
//                            if ( i1== directionPoint.size() - 1) {
//                                jObjd.put("lat", d_lat);
//                                jObjd.put("lng", d_lon);
//                                di_n.put(jObjd);
//                            }
//
//                        } catch (Exception e) {
//                            // TODO: handle exception
//                        }


//                }
            }


//			InputStream is = new MyInputStream("project.xml");
//			DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
//			DocumentBuilder documentBuilder = dbf.newDocumentBuilder();
//			documentBuilder.parse(is);

//            loadXMLFromString(jsonResponse);
//			InputStream is = new ByteArrayInputStream(jsonResponse.getBytes());
//
////			InputStream in = response.getEntity().getContent();
//			DocumentBuilder builder1 = DocumentBuilderFactory.newInstance().newDocumentBuilder();
//			Document doc = builder1.parse(is);


//			InputStream is = new MyInputStream("project.xml");
//			DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
//			DocumentBuilder documentBuilder = dbf.newDocumentBuilder();
//			documentBuilder.parse(is);


            return listGeopoints1;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static Document loadXMLFromString(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        InputStream is = new ByteArrayInputStream(xml.getBytes());
//		FileInputStream fis = new FileInputStream(xml);
        return builder.parse(is);
    }

	public static String getDurationText(Document doc) {
		NodeList nl1 = doc.getElementsByTagName("duration");
		Node node1 = nl1.item(nl1.getLength() - 1);
		NodeList nl2 = node1.getChildNodes();
		Node node2 = nl2.item(getNodeIndex(nl2, "text"));
		Log.i("DurationText", node2.getTextContent());
		return node2.getTextContent();
	}

	public static int getDurationValue(Document doc) {
		NodeList nl1 = doc.getElementsByTagName("duration");
		Node node1 = nl1.item(nl1.getLength() - 1);
		NodeList nl2 = node1.getChildNodes();
		Node node2 = nl2.item(getNodeIndex(nl2, "value"));
		Log.i("DurationValue", node2.getTextContent());
		return Integer.parseInt(node2.getTextContent());
	}

	public static String getDistanceText(Document doc) {
		NodeList nl1 = doc.getElementsByTagName("distance");
		Node node1 = nl1.item(nl1.getLength() - 1);
		NodeList nl2 = node1.getChildNodes();
		Node node2 = nl2.item(getNodeIndex(nl2, "text"));
		Log.i("DistanceText", node2.getTextContent());
		return node2.getTextContent();
	}

	public static int getDistanceValue(Document doc) {
		NodeList nl1 = doc.getElementsByTagName("distance");
		Node node1 = nl1.item(nl1.getLength() - 1);
		NodeList nl2 = node1.getChildNodes();
		Node node2 = nl2.item(getNodeIndex(nl2, "value"));
		Log.i("DistanceValue", node2.getTextContent());
		return Integer.parseInt(node2.getTextContent());
	}

	public static String getStartAddress(Document doc) {
		NodeList nl1 = doc.getElementsByTagName("start_address");
		Node node1 = nl1.item(0);
		Log.i("StartAddress", node1.getTextContent());
		return node1.getTextContent();
	}

	public static String getEndAddress(Document doc) {
		NodeList nl1 = doc.getElementsByTagName("end_address");
		Node node1 = nl1.item(0);
		Log.i("StartAddress", node1.getTextContent());
		return node1.getTextContent();
	}

	public static String getCopyRights(Document doc) {
		NodeList nl1 = doc.getElementsByTagName("copyrights");
		Node node1 = nl1.item(0);
		Log.i("CopyRights", node1.getTextContent());
		return node1.getTextContent();
	}

	public static ArrayList<LatLng> getDirection(Document doc) {
		NodeList nl1, nl2, nl3;
		ArrayList<LatLng> listGeopoints = new ArrayList<LatLng>();
		nl1 = doc.getElementsByTagName("step");
		if (nl1.getLength() > 0) {
			for (int i = 0; i < nl1.getLength(); i++) {
				Node node1 = nl1.item(i);
				nl2 = node1.getChildNodes();

				Node locationNode = nl2
						.item(getNodeIndex(nl2, "start_location"));
				nl3 = locationNode.getChildNodes();
				Node latNode = nl3.item(getNodeIndex(nl3, "lat"));
				double lat = Double.parseDouble(latNode.getTextContent());
				Node lngNode = nl3.item(getNodeIndex(nl3, "lng"));
				double lng = Double.parseDouble(lngNode.getTextContent());
				listGeopoints.add(new LatLng(lat, lng));

				locationNode = nl2.item(getNodeIndex(nl2, "polyline"));
				nl3 = locationNode.getChildNodes();
				latNode = nl3.item(getNodeIndex(nl3, "points"));
				ArrayList<LatLng> arr = decodePoly(latNode.getTextContent());
				for (int j = 0; j < arr.size(); j++) {
					listGeopoints.add(new LatLng(arr.get(j).latitude, arr
							.get(j).longitude));
				}

				locationNode = nl2.item(getNodeIndex(nl2, "end_location"));
				nl3 = locationNode.getChildNodes();
				latNode = nl3.item(getNodeIndex(nl3, "lat"));
				lat = Double.parseDouble(latNode.getTextContent());
				lngNode = nl3.item(getNodeIndex(nl3, "lng"));
				lng = Double.parseDouble(lngNode.getTextContent());
				listGeopoints.add(new LatLng(lat, lng));
			}
		}

		return listGeopoints;
	}

	private static int getNodeIndex(NodeList nl, String nodename) {
		for (int i = 0; i < nl.getLength(); i++) {
			if (nl.item(i).getNodeName().equals(nodename))
				return i;
		}
		return -1;
	}

	private static ArrayList<LatLng> decodePoly(String encoded) {
		ArrayList<LatLng> poly = new ArrayList<LatLng>();
		int index = 0, len = encoded.length();
		int lat = 0, lng = 0;
		while (index < len) {
			int b, shift = 0, result = 0;
			do {
				b = encoded.charAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
			lat += dlat;
			shift = 0;
			result = 0;
			do {
				b = encoded.charAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
			lng += dlng;

			LatLng position = new LatLng((double) lat / 1E5, (double) lng / 1E5);
			poly.add(position);
		}
		return poly;
	}
}