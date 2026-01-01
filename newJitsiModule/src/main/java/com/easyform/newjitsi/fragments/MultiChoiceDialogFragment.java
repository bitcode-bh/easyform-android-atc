package com.easyform.newjitsi.fragments;

import static android.content.Context.MODE_PRIVATE;

import android.app.Dialog;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.AbsListView;
import android.widget.ListView;

import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.DialogFragment;

import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetActivity;
import com.easyform.newjitsi.activitys.jitsimeet.CustomJitsiMeetViewModel;
import com.easyform.newjitsi.network.Models.participant.Participant;
import com.easyform.newjitsi.network.response.users.EasyFromUser;
import com.easyform.newjitsi.network.response.users.EasyFromUserItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class MultiChoiceDialogFragment extends DialogFragment {

    List<EasyFromUser> allEasyFromUserList = new ArrayList<>();
    ArrayList<EasyFromUser> checkedEasyFromUserList = new ArrayList<>();
    List<CharSequence> easyFromUserItemStringList = new ArrayList<>();
    String titleText = "";
    boolean isMultiselect = false;
    MultiChoiceDialogFragmentResult mMultiChoiceDialogFragmentResult = null;
    List<Participant> participantList = new ArrayList<>();
    SharedPreferences sharedPreferences;
    String currentUsername;
    String status;
    public static List<InviteListItem> inviteListItems = new ArrayList<>();
    public static InviteUserAdapter adapter;
    public static final Handler handler = new Handler(Looper.getMainLooper());
    public static final Map<String, Runnable> pendingTimeoutTasks = new HashMap<>();
    Bundle extras;
    public MultiChoiceDialogFragment(String title, List<EasyFromUser> allEasyFromUserList ,List<Participant> participantList, boolean isMultiselect,Bundle extras, MultiChoiceDialogFragmentResult mMultiChoiceDialogFragmentResult) {
        titleText = title;

        this.isMultiselect = isMultiselect;
        this.mMultiChoiceDialogFragmentResult = mMultiChoiceDialogFragmentResult;
        this.allEasyFromUserList = allEasyFromUserList;
        this.participantList =participantList ;
        this.extras = extras;
        for (EasyFromUser easyFromUser : allEasyFromUserList) {
            easyFromUserItemStringList.add(easyFromUser.getUsername());
        }
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity());

        if (isMultiselect) {
            sharedPreferences = getContext().getSharedPreferences("Jitsiuser", MODE_PRIVATE);
            currentUsername = sharedPreferences.getString("call_username", "");


            if (inviteListItems.isEmpty()) {
                List<EasyFromUser> invitedUsers = new ArrayList<>();
                List<EasyFromUser> otherUsers = new ArrayList<>();

                for (EasyFromUser easyFromUser : allEasyFromUserList) {
                    String userName = easyFromUser.getUsername();
                    boolean isInMeeting = false;
                    for (Participant participant : participantList) {
                        if (participant.getName().equalsIgnoreCase(userName)
                                || currentUsername.equalsIgnoreCase(userName)) {
                            isInMeeting = true;
                            break;
                        }
                    }

                    boolean isJoined = false;
                    if (isInMeeting) {
                        invitedUsers.add(easyFromUser);
                        for (Participant participant : participantList) {
                            if (participant.getName().equalsIgnoreCase(userName)) {
                                isJoined = true;
                                break;
                            }
                        }
                        status = isJoined ? "Joined" : "Request Sent";
                    } else {
                        otherUsers.add(easyFromUser);
                    }
                }

                if (!invitedUsers.isEmpty()) {
                    inviteListItems.add(new InviteListItem(InviteListItem.TYPE_HEADER, "Invited Users", null, false, ""));
                    for (EasyFromUser user : invitedUsers) {
                        inviteListItems.add(new InviteListItem(InviteListItem.TYPE_USER, null, user, true, status));
                    }
                }

                if (!otherUsers.isEmpty()) {
                    inviteListItems.add(new InviteListItem(InviteListItem.TYPE_HEADER, "Other Users", null, false, ""));
                    for (EasyFromUser user : otherUsers) {
                        inviteListItems.add(new InviteListItem(InviteListItem.TYPE_USER, null, user, false, ""));
                    }
                }

                adapter = new InviteUserAdapter(getActivity(), inviteListItems,extras, user -> {
                    Log.d("User Click", "Clicked User: " + user.getUsername());
                    if (mMultiChoiceDialogFragmentResult != null) {
                        List<EasyFromUser> singleList = new ArrayList<>();
                        singleList.add(user);
                        mMultiChoiceDialogFragmentResult.onMultiChoiceResult(singleList);
                    }
                    String username = user.getUsername();
                    Runnable timeoutRunnable = () -> {
                        for (InviteListItem item : inviteListItems) {
                            if (item.getType() == InviteListItem.TYPE_USER
                                    && item.getUser().getUsername().equalsIgnoreCase(username)
                                    && !"Joined".equalsIgnoreCase(item.getStatus())) {
                                item.setStatus("Not Joined");
                                if (adapter != null) {
                                    adapter.notifyDataSetChanged();
                                }
                                break;
                            }
                        }
                    };

                    pendingTimeoutTasks.put(username, timeoutRunnable);
                    handler.postDelayed(timeoutRunnable, 30000);
                });
            }

            builder.setAdapter(adapter, null);

            builder.setNegativeButton("Cancel", (dialogInterface, i) -> {
                if (mMultiChoiceDialogFragmentResult != null) {
                    inviteListItems.clear();
                    mMultiChoiceDialogFragmentResult.onDismissed();
                }
                dialogInterface.dismiss();
            });

            AlertDialog dialog = builder.create();

            dialog.setOnShowListener(dlg -> {
                ListView listView = dialog.getListView();
                if (listView != null) {
                    listView.setOnScrollListener(new AbsListView.OnScrollListener() {
                        @Override
                        public void onScrollStateChanged(AbsListView view, int scrollState) {}

                        @Override
                        public void onScroll(AbsListView view, int firstVisibleItem,
                                             int visibleItemCount, int totalItemCount) {

                            if (firstVisibleItem + visibleItemCount == totalItemCount) {

                                // Bottom reached — load next page
                                loadNextPage();
                            }
                        }
                    });
                }
            });

            return dialog;
        } else {
            builder.setTitle(titleText)
                    .setSingleChoiceItems(
                            easyFromUserItemStringList.toArray(new CharSequence[0]), -1,
                            (dialogInterface, i) -> {
                                checkedEasyFromUserList.clear();
                                checkedEasyFromUserList.add(allEasyFromUserList.get(i));
                            });

            builder.setPositiveButton("Request", (dialogInterface, i) -> {
                if (mMultiChoiceDialogFragmentResult != null) {
                    mMultiChoiceDialogFragmentResult.onMultiChoiceResult(checkedEasyFromUserList);
                }
            });

            builder.setOnDismissListener(dialogInterface -> {
                if (mMultiChoiceDialogFragmentResult != null) {
                    mMultiChoiceDialogFragmentResult.onDismissed();
                }
            });
        }

        return builder.create();
    }


    private boolean isLoading = false;
    private void loadNextPage() {
        if (isLoading || !CustomJitsiMeetActivity.hasMoreData) return;
        isLoading = true;

        CustomJitsiMeetActivity.offset += CustomJitsiMeetActivity.fetch;

        CustomJitsiMeetViewModel.getUserDataFromCompanyId(extras,
                CustomJitsiMeetActivity.offset,
                CustomJitsiMeetActivity.fetch
        );

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            List<EasyFromUserItem> list = CustomJitsiMeetActivity.easyFromUserItemList;

            if (list == null || list.isEmpty()) {
                isLoading = false;
                return;
            }

            List<EasyFromUser> data = list.get(0).getData();
            if (data == null || data.isEmpty()) {
                isLoading = false;
                CustomJitsiMeetActivity.hasMoreData = false; // no more pages
                return;
            }

            for (EasyFromUser u : data) {
                inviteListItems.add(new InviteListItem(InviteListItem.TYPE_USER, null, u, false, ""));
            }

            if (adapter != null)
                adapter.notifyDataSetChanged();

            isLoading = false;

        }, 500);
    }






    public interface MultiChoiceDialogFragmentResult {
        void onMultiChoiceResult(List<EasyFromUser> easyFromUserList);

        void onDismissed();
    }
}

