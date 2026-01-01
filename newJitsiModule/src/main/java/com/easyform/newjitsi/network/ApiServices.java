package com.easyform.newjitsi.network;

import com.easyform.newjitsi.network.requests.jwtToken.RoomNo;
import com.easyform.newjitsi.network.requests.notifcation.FirebaseRequest;
import com.easyform.newjitsi.network.requests.users.EasyFromUserRequest;
import com.easyform.newjitsi.network.response.jwtToken.JwtTokenResponse;
import com.easyform.newjitsi.network.response.notifcation.FirebaseResponse;
import com.easyform.newjitsi.network.response.users.EasyFromUserItem;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Url;

/**
 * Created by SavanSolanki on 20/06/2022.
 *
 * @author SavanSolanki
 */
public interface ApiServices {


    @POST
    Call<FirebaseResponse> sendNotification(@Url String url,
                                            @Header("Content-Type") String contentType,
                                            @Header("Authorization") String Authorization,
                                            @Body FirebaseRequest firebaseRequest);


    @POST
    Call<List<JwtTokenResponse>> getJwtToken(@Url String url,
                                             @Header("auth1") String auth1,
                                             @Body List<RoomNo> body
    );

    @POST
    Call<List<EasyFromUserItem>> getUserDataFromCompanyId(@Url String url,
                                                          @Header("auth1") String auth1,
                                                          @Header("Company_Feature_Id") String companyFeatureid,
                                                          @Header("Role_Id") String rold_id,
                                                          @Header("API_Key") String API_Key,
                                                          @Header("matchId") String matchId,
                                                          @Body List<EasyFromUserRequest> mEasyFromUserRequestList
    );
}
