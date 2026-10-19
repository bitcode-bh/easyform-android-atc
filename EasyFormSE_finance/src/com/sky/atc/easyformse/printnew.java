package com.sky.atc.easyformse;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Set;
import java.util.UUID;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.R.integer;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import net.sqlcipher.database.SQLiteDatabase;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.webkit.WebView;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import com.analogics.thermalAPI.Bluetooth_Printer_2inch_ThermalAPI;
import com.analogics.thermalprinter.AnalogicsThermalPrinter;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class printnew extends Activity {
	private SQLiteDatabase database;
	static final int ACTIVATION_REQUEST = 47;
	ComponentName demoDeviceAdmin;
	Button btnScanDevice;
	private ProgressDialog progress;
	ImageButton b;
	TextView stateBluetooth, btaddressTv;
	BluetoothAdapter bluetoothAdapter;
	private static final int REQUEST_ENABLE_BT = 1;
	private static final String TAG = null;
	private BluetoothAdapter mBluetoothAdapter = null;
	String device_name;
	String length;
	ArrayList<String> Product = new ArrayList<String>();
	ArrayList<String> qty = new ArrayList<String>();
	ArrayList<String> price = new ArrayList<String>();

	ArrayList<String> Product_new = new ArrayList<String>();
	ArrayList<Integer> e_space = new ArrayList<Integer>();
	ArrayList<Integer> cl_length = new ArrayList<Integer>();

	String data = "";
	int l_new;
	int col_length;

	WebView w;

	ListView listViewPaired;
	ListView listViewDetected;
	ArrayList<String> arrayListpaired;
	Button buttonSearch;
	ArrayAdapter<String> adapter, detectedAdapter;
	ListItemClicked listItemClicked;

	BluetoothDevice bdDevice;
	BluetoothClass bdClass;
	ArrayList<BluetoothDevice> arrayListPairedBluetoothDevices;

	ArrayList<BluetoothDevice> arrayListBluetoothDevices = null;
	ImageView print_search, pri_n;
	ImageButton pri_data;
	private static final UUID MY_UUID = UUID
			.fromString("0000110E-0000-1000-8000-00805F9B34FB");
	boolean ch_reciever = false;

	int cont = 0;
	int pair;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.print);

		Bundle extras = getIntent().getExtras();
		String value = null;
		if (extras != null) {
			value = extras.getString("jason");
		}
		// // b = (ImageButton) findViewById(R.id.print_new);

		pri_data = (ImageButton) findViewById(R.id.print_final);
		buttonSearch = (Button) findViewById(R.id.search);
		print_search = (ImageView) findViewById(R.id.print_search);
		pri_n = (ImageView) findViewById(R.id.print_new);
		progress = new ProgressDialog(printnew.this);
		// w.loadUrl("file:///android_asset/load.GIF");
		// String strJson =
		// " {\"list\":[{\"colum\" :[{\"endspace\":01,\"length\":3,\"align\":\"left\"},{\"endspace\":01,\"length\":3,\"align\":\"left\"},{\"endspace\":01,\"length\":3,\"align\":\"left\"}],\"Font\":38,\"data\": [ {\"type\": \"string\",\"value\": [\"Chocolate123456789\",\"2\",\"200\"]}]},{\"colum\" :[{\"endspace\":01,\"length\":3,\"align\":\"left\"},{\"endspace\":01,\"length\":3,\"align\":\"left\"},{\"endspace\":01,\"length\":3,\"align\":\"left\"}],\"Font\":38,\"data\": [ {\"type\": \"string\",\"value\": [\"Chocolate123456789\",\"2\",\"200\"]}]}] }";
		String data = "";
		String strJson = value;
		try {

			JSONObject jsonRootObject = null;

			JSONArray json = new JSONArray(strJson);

			for (int i = 0; i < json.length(); i++) {

				jsonRootObject = json.getJSONObject(i);
			}

			// Get the instance of JSONArray that contains JSONObjects
			JSONArray jsonArray = jsonRootObject.getJSONArray("list");
			main(jsonArray);
		} catch (JSONException e) {

			//e.printStackTrace();
		}

		IntentFilter filter = new IntentFilter(
				"android.bluetooth.device.action.PAIRING_REQUEST");

		androidx.core.content.ContextCompat.registerReceiver(this, myReceiver1, filter, androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED);

		/*
		 * Registering a new BTBroadcast receiver from the Main Activity context
		 * with pairing request event
		 */

		bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

		detectedAdapter = new ArrayAdapter<String>(this,
				R.layout.custom_textview);
		listViewDetected = (ListView) findViewById(R.id.listViewDetected);
		listViewDetected.setAdapter(detectedAdapter);
		listItemClicked = new ListItemClicked();
		detectedAdapter.notifyDataSetChanged();
		listViewDetected.setOnItemClickListener(listItemClicked);
		arrayListBluetoothDevices = new ArrayList<BluetoothDevice>();

		getPairedDevices();
		if (pair > 0) {

			try {

				new LongOperation().execute("");

			}

			catch (Exception e) {

			}

		}

		buttonSearch.setOnClickListener(new OnClickListener() {

			@Override
			public void onClick(View v) {
				// TODO Auto-generated method stub
				startSearching(v);

				// printdata();
			}
		});

		CheckBlueToothState();
		// getPairedDevices();

	}

	private void CheckBlueToothState() {
		if (bluetoothAdapter == null) {
			// stateBluetooth.setText("Bluetooth NOT support");
		} else {
			if (bluetoothAdapter.isEnabled()) {
				if (bluetoothAdapter.isDiscovering()) {

				} else {

				}
			} else {
				// stateBluetooth.setText("Bluetooth is NOT Enabled!");
				Intent enableBtIntent = new Intent(
						BluetoothAdapter.ACTION_REQUEST_ENABLE);
				startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
			}
		}
	}

	private Button.OnClickListener btnScanDeviceOnClickListener = new Button.OnClickListener() {

		@Override
		public void onClick(View arg0) {
			// TODO Auto-generated method stub
			bluetoothAdapter.startDiscovery();
		}
	};

	private final BroadcastReceiver ActionFoundReceiver = new BroadcastReceiver() {

		@Override
		public void onReceive(Context context, Intent intent) {
			// TODO Auto-generated method stub
			String action = intent.getAction();
			// Set<BluetoothDevice> devices = adapter.getBondedDevices();
			if (BluetoothDevice.ACTION_FOUND.equals(action)) {

				BluetoothDevice device = intent
						.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
				String k = device.getAddress() + "\n" + device.getName();
				device_name = device.getAddress();

				k.getBytes();

			}
		}
	};

	void printdata() {

		try {

			// unregisterReceiver(ActionFoundReceiver);
			// Sample code to print the data with the Analogics 2" Thermal
			// Bluetooth
			// printer

			// create the object for the Bluetooth_Printer_2inch_ThermalAPI
			// class

			Bluetooth_Printer_2inch_ThermalAPI preparePrintData = new Bluetooth_Printer_2inch_ThermalAPI();

			// call the any method in Bluetooth_Printer_2inch_ThermalAP class
			// and
			// save the return value in String variable

			preparePrintData.Reset();
			// String data = "ProductName       Qty         Price\n"
			// + "-----------      ---         -------\n"
			// + "parle             1              20 \n"
			// + "chocolate         1              30 \n"
			// + "                 -----          ----\n "
			// + "                 Total           50 \n";

			// String data = "Maulik1\n" + "Haresh:\n vadaj_to";

			String printdata = preparePrintData.font_Courier_38(data);

			// create the object for the AnalogicsThermalPrinter class

			AnalogicsThermalPrinter printer = new AnalogicsThermalPrinter();

			progress = new ProgressDialog(printnew.this);
			progress.setCancelable(true);
			progress.setMessage("Printing In Process ...");
			progress.setProgressStyle(ProgressDialog.STYLE_SPINNER);
			progress.setProgress(0);
			progress.setMax(100);
			progress.show();

			// call the Call_PrintertoPrint(String BTaddress, String
			// printdata)method in
			// AnalogicsThermalPrinter class and pass the parameters to the
			// Call_PrintertoPrint method to print the data
			boolean k = printer.Call_PrintertoPrint(bdDevice.getAddress(),
					printdata);

			progress.hide();

			// Bundle b = new Bundle();
			// b.putString("status", "Print Successfully...!!!");
			// Intent intent = new Intent();
			// intent.putExtras(b);
			// setResult(RESULT_OK, intent);
			// finish();

			if (k == true) {

			}

		} catch (Exception e) {
			//e.printStackTrace();

		}

	}

	void String_make() {

	}

	void proadd(String name) {

		Product.add(name);

	}

	void proadd_n(String name) {

		Product_new.add(name);

	}

	void qty(String name) {

		qty.add(name);

	}

	void pric(String name) {

		price.add(name);

	}

	void strmake() {
		int i = 0;
		int j = 0;
		int k = 0;

		String p_nam1 = null, qt1 = null, pr1 = null;

		while (i < Product.size()) {
			int p_nam = 0, qt = 0, pr = 0;
			String p_name = Product.get(i).toString();

			String qty1 = qty.get(i).toString();
			String price1 = price.get(i).toString();
			if (p_name.length() > 12) {
				if (k > 0) {

					if (p_name.length() > 12 * (k + 1)) {

						p_nam1 = p_name.substring(12 * k, 12 * (k + 1));
					} else {

						p_nam1 = p_name.substring(12 * k, p_name.length());
						p_nam = 0;

					}
				}
				if (k == 0)

				{
					p_nam1 = p_name.substring(0, 12);
					p_nam++;
				}

			} else {
				if (k == 0)

				{
					p_nam1 = p_name.substring(0, p_name.length());
				} else {
					p_nam1 = "";

				}

			}

			if (qty1.length() > 12) {

				if (k > 0) {

					if (qty1.length() > 12 * (k + 1)) {

						qt1 = qty1.substring(12 * k, 12 * (k + 1));
					} else {
						qt1 = qty1.substring(12 * k, qty1.length());

					}

				}

				if (k == 0)

				{
					p_nam1 = p_name.substring(0, qty1.length());
				}
				qt++;
			} else {
				if (k == 0)

				{
					qt1 = qty1.substring(0, qty1.length());
				} else {
					qt1 = "";

				}

			}

			if (price1.length() > 12) {

				if (k > 0)

				{
					if (price1.length() > 12 * (k + 1)) {

						pr1 = price1.substring(12 * k, 12 * (k + 1));
					} else {
						pr1 = price1.substring(12 * k, price1.length());

					}
				}

				if (k == 0)

				{
					p_nam1 = p_name.substring(0, 12);
				}

				pr++;

			}

			else {
				if (k == 0)

				{

					pr1 = price1.substring(0, price1.length());
				} else {
					pr1 = "";

				}

			}

			String data1;
			if (pr > 0 || qt > 0 || p_nam > 0) {

				j = i;
				k++;

			} else {
				i++;
				k = 0;

				// data1 = p_nam1 + "           " + qt1 + "            " + pr1
				// + "\n";

			}

			if (p_nam1.length() < 12) {
				int diff = 12 - p_nam1.length();

				for (int l = 0; l < diff; l++) {
					p_nam1 = p_nam1 + " ";
				}

			}

			if (qt1.length() < 12) {
				int diff = 12 - qt1.length();

				for (int l = 0; l < diff; l++) {
					qt1 = qt1 + " ";
				}

			}

			if (pr1.length() < 12) {
				int diff = 12 - pr1.length();

				for (int l = 0; l < diff; l++) {
					pr1 = pr1 + " ";
				}

			}

			data1 = p_nam1 + " " + qt1 + " " + pr1;

			data = data + data1;
		}

	}

	void strmake_new() {
		int i = 0;
		int l_n = 0;
		int j = 0;
		int k = 0;
		int d = 0;

		String p_nam1 = null, qt1 = null, pr1 = null;

		while (i < Product_new.size()) {

			int p_nam = 0, qt = 0, pr = 0;

			String qty1 = Product_new.get(i).toString();

			if (qty1.length() > 12) {

				if (k > 0) {

					if (qty1.length() > 12 * (k + 1)) {

						qt1 = qty1.substring(12 * k, 12 * (k + 1));
						qt++;
					} else {
						qt1 = qty1.substring(12 * k, qty1.length());
						qt = 0;

					}

				}

				if (k == 0)

				{
					qt1 = qty1.substring(0, 12);
					qt++;
				}

			} else {
				if (k == 0)

				{
					qt1 = qty1.substring(0, qty1.length());
				} else {
					qt1 = "";

				}

			}

			String data1;

			if (qt1.length() < 12) {
				int diff = 12 - qt1.length();

				for (int l = 0; l < diff; l++) {
					qt1 = qt1 + " ";
				}

			}

			if (pr > 0 || qt > 0 || p_nam > 0) {

				if (d == 0) {

					j = i;
					i++;
					d++;
					l_n++;

				}

			} else {
				i++;

			}

			if (l_new == i) {

				if (l_n == 1) {
					k = 1;
					l_n = 0;
					i = i - l_new;

				} else {

					k = 0;

				}

				data1 = qt1;

				data = data + "  " + data1 + "\n";
			} else {

				data1 = qt1;

				data = data + "  " + data1;

			}
		}
	}

	void strmake_new1() {
		int i = 0;
		int l_n = 0;
		int j = 0;
		int k = 0;
		int d = 0;

		String p_nam1 = null, qt1 = null, pr1 = null;

		while (i < Product_new.size()) {

			int p_nam = 0, qt = 0, pr = 0;

			String qty1 = Product_new.get(i).toString();
			int end_space = e_space.get(i);
			int cl_l = cl_length.get(i);

			if (qty1.length() > cl_l) {

				if (k > 0) {

					if (qty1.length() > cl_l * (k + 1)) {

						qt1 = qty1.substring(cl_l * k, cl_l * (k + 1));
						qt++;
					} else {
						qt1 = qty1.substring(cl_l * k, qty1.length());
						qt = 0;

					}

				}

				if (k == 0)

				{
					qt1 = qty1.substring(0, cl_l);
					qt++;
				}

			} else {
				if (k == 0)

				{
					qt1 = qty1.substring(0, qty1.length());
				} else {
					qt1 = "";

				}

			}

			String data1;

			if (qt1.length() < cl_l + end_space) {
				int diff = cl_l + end_space - qt1.length();

				for (int l = 0; l < diff; l++) {
					qt1 = qt1 + " ";
				}

			}

			if (pr > 0 || qt > 0 || p_nam > 0) {

				if (d == 0) {

					j = i;
					i++;
					d++;
					l_n++;

				} else {
					i++;

				}

			} else {
				i++;

			}

			if (l_new == i) {

				if (l_n == 1) {
					k++;
					;
					l_n = 0;
					d = 0;
					i = i - l_new;

				} else {

					k = 0;

				}

				data1 = qt1;

				data = data + "  " + data1 + "\n";
			} else {

				data1 = qt1;

				data = data + "  " + data1;

			}
		}
	}

	void js1(JSONArray jsonArray) {

		for (int i = 0; i < jsonArray.length(); i++) {

			try {
				JSONObject jsonObject = jsonArray.getJSONObject(i);

				int endspace = Integer.valueOf((jsonObject
						.getString("endspace")));
				int length = Integer.valueOf((jsonObject.getString("length")));
				String align = (jsonObject.optString("align").toString());

				e_space.add(endspace);
				cl_length.add(length);

			} catch (Exception e) {

			}
		}

	}

	void main(JSONArray jsonArray) {

		for (int i = 0; i < jsonArray.length(); i++) {

			try {
				JSONObject jsonObject = jsonArray.getJSONObject(i);

				JSONArray jsonArray1 = jsonObject.optJSONArray("colum");

				l_new = jsonArray1.length();
				String Font = jsonObject.getString("Font");
				JSONArray jsonArray2 = jsonObject.optJSONArray("data");

				for (int k = 0; k < jsonArray2.length(); k++) {
					e_space = new ArrayList<Integer>();
					cl_length = new ArrayList<Integer>();
					JSONObject jsonObject1 = jsonArray2.getJSONObject(k);
					js1(jsonArray1);
					js3(jsonObject1);
					strmake_new1();
				}
				// String endspace =
				// (jsonObject.optString("endspace").toString());
				// length = (jsonObject.optString("length").toString());
				// String align = (jsonObject.optString("align").toString());

			} catch (Exception e) {

			}
		}

	}

	void js2(JSONArray jsonArray) {

		try {

			for (int i = 0; i < jsonArray.length(); i++) {

				JSONObject jsonObject = jsonArray.getJSONObject(i);

				String endspace = (jsonObject.optString("type").toString());

				JSONArray jsonArray2 = jsonObject.optJSONArray("value");
				Product_new = new ArrayList<String>();

				for (int j = 0; j < jsonArray2.length(); j++) {

					String pname = jsonArray2.getString(j);
					proadd_n(pname);

				}

			}

		} catch (Exception e) {

			//e.printStackTrace();

		}
	}

	void js3(JSONObject jsonObject) {

		try {

			String endspace = (jsonObject.optString("type").toString());

			JSONArray jsonArray2 = jsonObject.optJSONArray("value");
			Product_new = new ArrayList<String>();

			for (int j = 0; j < jsonArray2.length(); j++) {

				String pname = jsonArray2.getString(j);
				proadd_n(pname);

			}

		} catch (Exception e) {

			//e.printStackTrace();

		}
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		switch (requestCode) {
		case 1:
			// retour de la version utilisant le sample de imense alpr
			if (resultCode == android.app.Activity.RESULT_OK
					&& requestCode == REQUEST_ENABLE_BT) { // 0:ok
				getPairedDevices();
				if (pair > 0) {

					try {

						new LongOperation().execute("");

					}

					catch (Exception e) {

					}

				}
				// startSearching();

			}
			break;
		default:
			break;
		}
	}

	private BroadcastReceiver myReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			Message msg = Message.obtain();
			String action = intent.getAction();
			print_search.setVisibility(View.INVISIBLE);

			if (BluetoothDevice.ACTION_FOUND.equals(action)) {
				// Toast.makeText(context, "ACTION_FOUND", Toast.LENGTH_SHORT)
				// .show();

				BluetoothDevice device = intent
						.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
				try {
					// device.getClass().getMethod("setPairingConfirmation",
					// boolean.class).invoke(device, true);
					// device.getClass().getMethod("cancelPairingUserInput",
					// boolean.class).invoke(device);
				} catch (Exception e) {
					Log.i("Log", "Inside the exception: ");
					//e.printStackTrace();
				}

				if (arrayListBluetoothDevices.size() < 1) // this checks if the
															// size of bluetooth
															// device is 0,then
															// add the
				{ // device to the arraylist.
					detectedAdapter.add(device.getName() + "\n"
							+ device.getAddress());
					arrayListBluetoothDevices.add(device);
					detectedAdapter.notifyDataSetChanged();
				} else {
					boolean flag = true; // flag to indicate that particular
											// device is already in the arlist
											// or not
					for (int i = 0; i < arrayListBluetoothDevices.size(); i++) {
						if (device.getAddress().equals(
								arrayListBluetoothDevices.get(i).getAddress())) {
							flag = false;
						}
					}
					if (flag == true) {
						detectedAdapter.add(device.getName());
						arrayListBluetoothDevices.add(device);
						detectedAdapter.notifyDataSetChanged();
					}
				}
			}
		}
	};

	private void startSearching(View v) {
		Log.i("Log", "in the start searching method");

		print_search.setVisibility(View.VISIBLE);

		Animation anim = new MyAnimation(print_search, 30);
		anim.setDuration(3000);
		print_search.startAnimation(anim);

		// print_search.invalidate();
		// print_search.startAnimation(anim);

		// int pair = getPairedDevices();
		// if (pair == 0) {
		//
		// print_search.setVisibility(View.INVISIBLE);
		// print_data();
		//
		// } else {
		// Animation shake = AnimationUtils.loadAnimation(this, R.anim.shake);
		// pri_n.startAnimation(shake);

		arrayListBluetoothDevices = new ArrayList<BluetoothDevice>();
		detectedAdapter.clear();
		IntentFilter intentFilter = new IntentFilter(
				android.bluetooth.BluetoothDevice.ACTION_FOUND);

		androidx.core.content.ContextCompat.registerReceiver(this, myReceiver, intentFilter, androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED);

		bluetoothAdapter.startDiscovery();

		// }

	}

	class ListItemClicked implements OnItemClickListener {
		@Override
		public void onItemClick(AdapterView<?> parent, View view, int position,
				long id) {
			// TODO Auto-generated method stub
			bdDevice = arrayListBluetoothDevices.get(position);
			// bdClass = arrayListBluetoothDevices.get(position);
			Log.i("Log", "The dvice : " + bdDevice.toString());
			/*
			 * here below we can do pairing without calling the callthread(), we
			 * can directly call the connect(). but for the safer side we must
			 * usethe threading object.
			 */
			// callThread();
			// connect(bdDevice);
			boolean isBonded = false;
			if (bdDevice.getName().equalsIgnoreCase("anthermal")) {
				// try {
				// if (pair > 0) {
				//
				// // unregisterReceiver(myReceiver);
				// // unregisterReceiver(myReceiver1);
				//
				// new LongOperation().execute("");
				// }
				//
				// else {
				// alertbox("Reciever",
				//
				// "Your Printer is not reachable or Bluetooth not started of your printer....");
				// //
				// }
				// } catch (Exception e) {
				// ////e.printStackTrace()();
				// }
				// } else {

				progress = new ProgressDialog(printnew.this);
				progress.setCancelable(true);
				progress.setMessage("Connecting ...");
				progress.setProgressStyle(ProgressDialog.STYLE_SPINNER);
				progress.setProgress(0);
				progress.setMax(100);
				progress.show();

				isBonded = pairDevice(bdDevice);

				cont++;
			} else {

				alertbox("Device",
						"Please Connect with Proper Bluetooth device ANTHERMAL....");

			}

			try {

				// isBonded = createBond(bdDevice);
				// if (isBonded) {
				// //
				// arrayListpaired.add(bdDevice.getName()+"\n"+bdDevice.getAddress());
				// // adapter.notifyDataSetChanged();
				// // getPairedDevices();
				// adapter.notifyDataSetChanged();
				// }
			} catch (Exception e) {
				//e.printStackTrace();
			}// connect(bdDevice);
			Log.i("Log", "The bond is created: " + isBonded);

		}
	}

	private boolean pairDevice(BluetoothDevice device) {

		boolean k;
		try {
			Log.d("pairDevice()", "Start Pairing...");
			Method m = device.getClass()
					.getMethod("createBond", (Class[]) null);
			m.invoke(device, (Object[]) null);
			Log.d("pairDevice()", "Pairing finished.");
			k = true;
		} catch (Exception e) {
			Log.e("pairDevice()", e.getMessage());
			k = false;
		}

		return k;
	}

	void alertbox(String main_ti, String sub_ti) {
		try {
			AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(
					this);

			// set title
			alertDialogBuilder.setTitle(main_ti);

			// set dialog message
			alertDialogBuilder
					.setMessage(sub_ti)
					.setCancelable(false)
					.setPositiveButton("Ok",
							new DialogInterface.OnClickListener() {
								public void onClick(DialogInterface dialog,
										int id) {
									// if this button is clicked, close
									// current activity

								}
							});

			// create alert dialog
			AlertDialog alertDialog = alertDialogBuilder.create();

			// show it
			alertDialog.show();
		} catch (Exception e) {

			//e.printStackTrace();

		}
	}

	void print_data() {

		buttonSearch.setVisibility(View.INVISIBLE);
		print_search.setVisibility(View.INVISIBLE);
		pri_data.setVisibility(View.VISIBLE);
		listViewDetected.setVisibility(View.INVISIBLE);
		pri_n.setVisibility(View.INVISIBLE);
		Animation shake = AnimationUtils.loadAnimation(this, R.anim.shake);
		pri_data.startAnimation(shake);
		pri_data.setOnClickListener(new OnClickListener() {

			@Override
			public void onClick(View arg0) {
				// TODO Auto-generated method stub
				printdata();

				// printdata();
			}
		});

	}

	private final BroadcastReceiver mReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			String action = intent.getAction();
			BluetoothDevice device = intent
					.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);

			if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(action)) {

				if (bdDevice.getName().equalsIgnoreCase("anthermal")) {

					System.out.print("h");
				}

			}

		}

	};

	private BroadcastReceiver myReceiver1 = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			if (intent.getAction().equals(
					"android.bluetooth.device.action.PAIRING_REQUEST")) {
				try {
					progress.hide();
					BluetoothDevice device = intent
							.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
					int pin = intent.getIntExtra(
							"android.bluetooth.device.extra.PAIRING_KEY", 0);
					// the pin in case you need to accept for an specific pin
					Log.d("PIN",
							" "
									+ intent.getIntExtra(
											"android.bluetooth.device.extra.PAIRING_KEY",
											0));
					// maybe you look for a name or address
					Log.d("Bonded", device.getName());
					byte[] pinBytes;
					pinBytes = ("" + pin).getBytes("UTF-8");
					device.setPin(pinBytes);
					// setPairing confirmation if neeeded
					boolean k = device.setPairingConfirmation(true);

					print_data();

					// alertbox("Bluetooth Connecation",
					// "Your Device Ready For Print...");

				} catch (Exception e) {
					//e.printStackTrace();
				}
			}
		}
	};

	private int getPairedDevices() {

		// print_search.setVisibility(View.VISIBLE);
		//
		// Animation anim = new MyAnimation(print_search, 30);
		// anim.setDuration(3000);
		// anim.startNow();

		int k = -1;
		Set<BluetoothDevice> pairedDevice = bluetoothAdapter.getBondedDevices();
		if (pairedDevice.size() > 0) {
			for (BluetoothDevice device : pairedDevice) {

				if (device.getName().equalsIgnoreCase("anthermal")) {
					try {
						pair++;
						k = 0;
						bdDevice = device;
						// k = con(device);
					} catch (Exception e) {
						// TODO Auto-generated catch block
						//e.printStackTrace();
					}
					System.out.print("h");

				}

			}

		}
		return k;
	}

	@Override
	public void onBackPressed() {

		Intent intent = new Intent();

		setResult(RESULT_CANCELED, intent);
		finish();
		// TODO Auto-generated method stub
		super.onBackPressed();
	}

	private class LongOperation extends AsyncTask<String, Void, Integer> {
		int K;

		@Override
		protected Integer doInBackground(String... params) {
			K = con(bdDevice);

			return K;
		}

		@Override
		protected void onPostExecute(Integer result) {

			progress.hide();
			if (K == 0) {

				print_data();
			}
		}

		@Override
		protected void onPreExecute() {

			progress.setCancelable(true);
			progress.setMessage("Connecting ...");
			progress.setProgressStyle(ProgressDialog.STYLE_SPINNER);
			progress.setProgress(0);
			progress.setMax(100);
			progress.show();

		}

		@Override
		protected void onProgressUpdate(Void... values) {
		}
	}

	int con(BluetoothDevice device) {

		int j = 0;
		// this.unregisterReceiver(myReceiver);
		//
		// progress = new ProgressDialog(printnew.this);
		// progress.setCancelable(true);
		// progress.setMessage("Connecting ...");
		// progress.setProgressStyle(ProgressDialog.STYLE_SPINNER);
		// progress.setProgress(0);
		// progress.setMax(100);
		// progress.show();

		if (device.getBondState() == device.BOND_BONDED) {

			Log.d(TAG, device.getName());
			// BluetoothSocket mSocket=null;
			BluetoothSocket mSocket = null;
			try {

				mSocket = device
						.createInsecureRfcommSocketToServiceRecord(MY_UUID);

				UUID MY_UUID = UUID
						.fromString("00001101-0000-1000-8000-00805F9B34FB");
				device = bluetoothAdapter.getRemoteDevice(device.getAddress());
				bluetoothAdapter.cancelDiscovery();
				mSocket = device.createRfcommSocketToServiceRecord(MY_UUID);
				mSocket.connect();
				mSocket.close();

			} catch (IOException e) {
				j = 1;
				try {
					Bundle b = new Bundle();
					b.putString("result",
							"Reciever device Bluetooth not started.....");
					Intent intent = new Intent();
					intent.putExtras(b);
					finish();
					setResult(RESULT_CANCELED, intent);
					mSocket.close();
					Log.d(TAG, "Cannot connect");
				} catch (IOException e1) {

					Bundle b = new Bundle();
					b.putString("result",
							"Reciever device Bluetooth not started.....");
					Intent intent = new Intent();
					intent.putExtras(b);
					setResult(RESULT_CANCELED, intent);
					Log.d(TAG, "Socket not closed");
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}

			}

		}
		return j;
	}

	@Override
	protected void onPause() {

		// unregisterReceiver(myReceiver);
		unregisterReceiver(myReceiver1);

		// TODO Auto-generated method stub
		super.onPause();

	}

	@Override
	protected void onResume() {

		IntentFilter filter = new IntentFilter(
				"android.bluetooth.device.action.PAIRING_REQUEST");

		androidx.core.content.ContextCompat.registerReceiver(this, myReceiver1, filter, androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED);

		// TODO Auto-generated method stub
		super.onResume();
	}

}

// ------------------------------------------------------------