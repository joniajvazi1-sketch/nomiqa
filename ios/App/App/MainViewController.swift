import UIKit
import Capacitor

/**
 * MainViewController - Custom Bridge Controller with Manual Plugin Registration
 * 
 * This subclass of CAPBridgeViewController ensures our custom plugins are
 * explicitly registered with the Capacitor bridge at runtime.
 * 
 * This is necessary because automatic plugin discovery via the .m bridging
 * file can fail in certain Xcode/Swift configurations.
 */
class MainViewController: CAPBridgeViewController {
    
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        
        // Manually register our custom iOS plugins
        // This ensures the plugins are available even if automatic discovery fails
        bridge?.registerPluginInstance(IOSBackgroundLocationPlugin())
        
        print("[MainViewController] Custom plugins registered successfully")
    }
}
