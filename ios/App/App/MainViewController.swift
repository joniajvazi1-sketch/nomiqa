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
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set dark background to prevent white/black flash during WebView load
        self.view.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0) // #0a0a0a
        self.webView?.isOpaque = false
        self.webView?.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0)
        self.webView?.scrollView.backgroundColor = UIColor(red: 0.039, green: 0.039, blue: 0.039, alpha: 1.0)
        
        print("[MainViewController] WebView background configured for dark theme")
    }
    
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        
        // Manually register our custom iOS plugins
        // This ensures the plugins are available even if automatic discovery fails
        bridge?.registerPluginInstance(IOSBackgroundLocationPlugin())
        
        print("[MainViewController] Custom plugins registered successfully")
    }
}
