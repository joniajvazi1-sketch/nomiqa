package com.nomiqa.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugins
        registerPlugin(TelephonyInfoPlugin.class);
        
        super.onCreate(savedInstanceState);
    }
}
