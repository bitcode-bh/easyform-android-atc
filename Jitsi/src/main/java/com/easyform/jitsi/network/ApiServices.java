package com.easyform.jitsi.network;

import com.easyform.jitsi.network.Models.FcmRequest;
import com.easyform.jitsi.network.Models.FirebaseResponse;
import com.easyform.jitsi.network.Models.JwtTokenResponce;
import com.easyform.jitsi.network.Models.UserGetResponse;
import com.easyform.jitsi.network.requests.RoomNo;
import com.easyform.jitsi.network.requests.notifcation.FirebaseRequest;

import org.json.JSONArray;
import org.json.JSONObject;

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

    /**
     * @param url   gave full url of Server to call
     * @param auth1 {@link com.easyform.jitsi.network.requests.AuthJson} pass authjson data in String
     * @param body  @{@link List<RoomNo>} pass list of the @{@link RoomNo}
     * @return ti will give Response of the api call in {@link JwtTokenResponce}
     * @apiNote this method use to get Jwt token from server
     * @author SavanSolanki
     */
    @POST
    Call<List<JwtTokenResponce>> getJwtToken(@Url String url,
                                             @Header("auth1") String auth1,
                                             @Body List<RoomNo> body
    );

    /**
     * @param url             gave full url of google firebase notification api
     * @param contentType     contentType is application/json
     * @param Authorization   Authorization of firebase project
     * @param firebaseRequest {@link FirebaseRequest} pass FirebaseRequest
     * @return ti will give Response of the api call in {@link FirebaseResponse}
     * @apiNote this method is send Notification
     * @author SavanSolanki
     */
    @POST
    Call<FirebaseResponse> sendNotification(@Url String url,
                                            @Header("Content-Type") String contentType,
                                            @Header("Authorization") String Authorization,
                                            @Body FirebaseRequest firebaseRequest);


    /**
     * @param url
     * @param auth1
     * @param fcmRequest
     * @return it will give Response of api call on in {@link UserGetResponse}
     * @apiNote this method is GetUserFcmList
     * @author Savan Solanki
     */

    @POST
    Call<List<UserGetResponse>> GetUserData(@Url String url,
                                            @Header("auth1") String auth1,
                                            @Header("Company_Feature_Id") String companyFeatureid,
                                            @Header("Role_Id") String rold_id,
                                            @Header("API_Key") String API_Key,
                                            @Header("matchId") String matchId,
                                            @Body List<FcmRequest> fcmRequest);
}
