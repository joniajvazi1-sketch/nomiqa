import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

interface CompatibilityCheckerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iosDevices = [
  "iPad 10th Gen", "iPad 8th Gen (WiFi+Cellular)", "iPad Air 3rd Gen", "iPad air 4th Gen (WiFi+Cellular)",
  "iPad Air 5th Gen (WiFi+Cellular)", "iPad mini 5th Gen", "iPad Pro 11-inch 3rd Gen",
  "iPad Pro 11 inch 3rd Gen (1TB, WiFi+Cellular)", "iPad Pro 11 inch 3rd Gen (WiFi+Cellular)",
  "iPad Pro 11-inch 4th Gen", "iPad Pro 11 inch 4th Gen (WiFi+Cellular)",
  "iPad Pro 12.9 inch 3rd Gen (1TB, WiFi+Cellular)", "iPad Pro 12.9 inch 3rd Gen (WiFi+Cellular)",
  "iPad Pro 12.9 inch 4th Gen (WiFi+Cellular)", "iPad Pro 12.9 inch 5th Gen", "iPad Pro 12.9 inch 6th Gen",
  "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro",
  "iPhone 12 Pro Max", "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 14",
  "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro",
  "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 16e",
  "iPhone SE 2nd Gen", "iPhone SE 3rd Gen", "iPhone XR", "iPhone XS", "iPhone XS Max",
  "iPhone XS Max Global", "iPhone 17 (all models)"
];

const androidDevices = [
  { brand: "ABCTECH", model: "X20" },
  { brand: "Alcatel", model: "V3 Ultra" },
  { brand: "asus", model: "ZenFone Max Pro M1 (ZB602KL) (WW) / Max Pro M1 (ZB601KL) (IN)" },
  { brand: "asus", model: "ZenFone Max Pro M2 (ZB631KL) (WW) / Max Pro M2 (ZB630KL) (IN)" },
  { brand: "BALMUDA", model: "BALMUDA Phone" },
  { brand: "bq", model: "Aquaris X2" },
  { brand: "bq", model: "Aquaris X2 PRO" },
  { brand: "CIBER", model: "B610A115" },
  { brand: "Covid", model: "CP-G3" },
  { brand: "DOOGEE", model: "V30" },
  { brand: "dtab", model: "dtab d-51C" },
  { brand: "Energizer", model: "Hardcase H620S" },
  { brand: "Evolveo", model: "EVOLVEO StrongPhone G9" },
  { brand: "Fairphone", model: "Fairphone 4" },
  { brand: "FCNT", model: "arrows BZ03" },
  { brand: "FCNT", model: "arrows N F-51C" },
  { brand: "FCNT", model: "arrows We A101FC" },
  { brand: "Fossil", model: "Fossil Gen 5 LTE" },
  { brand: "Gigaset", model: "Gigaset GX4 PRO" },
  { brand: "Google", model: "Pixel 2" },
  { brand: "Google", model: "Pixel 2 XL" },
  { brand: "Google", model: "Pixel 3" },
  { brand: "Google", model: "Pixel 3 XL" },
  { brand: "Google", model: "Pixel 3a" },
  { brand: "Google", model: "Pixel 3a XL" },
  { brand: "Google", model: "Pixel 4" },
  { brand: "Google", model: "Pixel 4 XL" },
  { brand: "Google", model: "Pixel 4a" },
  { brand: "Google", model: "Pixel 4a (5G)" },
  { brand: "Google", model: "Pixel 5" },
  { brand: "Google", model: "Pixel 5a 5G" },
  { brand: "Google", model: "Pixel 6" },
  { brand: "Google", model: "Pixel 6 Pro" },
  { brand: "Google", model: "Pixel 6a" },
  { brand: "Google", model: "Pixel 7" },
  { brand: "Google", model: "Pixel 7 Pro" },
  { brand: "Google", model: "Pixel 7a" },
  { brand: "Google", model: "Pixel 8" },
  { brand: "Google", model: "Pixel 8 Pro" },
  { brand: "Google", model: "Pixel Fold" },
  { brand: "Hamic", model: "MIELS" },
  { brand: "hammer", model: "Hammer Blade 5G" },
  { brand: "hammer", model: "Hammer Construction" },
  { brand: "Honeywell", model: "CT30XP" },
  { brand: "Honeywell", model: "CT45 XP" },
  { brand: "Honeywell", model: "CT47" },
  { brand: "Honeywell", model: "EDA52" },
  { brand: "Honeywell", model: "EDA5S" },
  { brand: "Honor", model: "Honor 90" },
  { brand: "Honor", model: "Honor Magic4 Pro" },
  { brand: "HONOR", model: "FRI" },
  { brand: "HONOR", model: "HONOR Magic4 Pro" },
  { brand: "HONOR", model: "HONOR Magic5 Pro" },
  { brand: "Hoozo", model: "HZ0010J" },
  { brand: "Huawei", model: "Mate 40 Pro" },
  { brand: "Huawei", model: "P40" },
  { brand: "Huawei", model: "P40 Pro" },
  { brand: "isafemobile", model: "IS540" },
  { brand: "KDDI", model: "AQUOS sense6s" },
  { brand: "KDDI", model: "AQUOS sense7" },
  { brand: "KDDI", model: "AQUOS wish2" },
  { brand: "KYOCERA", model: "Android One S10" },
  { brand: "KYOCERA", model: "Android One S9" },
  { brand: "KYOCERA", model: "DIGNO SANGA edition" },
  { brand: "KYOCERA", model: "DIGNO SX2" },
  { brand: "KYOCERA", model: "DIGNO SX3" },
  { brand: "KYOCERA", model: "かんたんスマホ２" },
  { brand: "KYOCERA", model: "かんたんスマホ2+" },
  { brand: "KYOCERA", model: "かんたんスマホ3" },
  { brand: "Lenovo", model: "d-42A" },
  { brand: "Lenovo", model: "d-52C" },
  { brand: "LOGIC", model: "LOGIC MV01" },
  { brand: "LOGIC", model: "LOGIC MV02" },
  { brand: "MiTAC", model: "N630" },
  { brand: "MiTAC", model: "N672" },
  { brand: "Mobvoi", model: "TicWatch Pro 3 Cellular/LTE" },
  { brand: "Montblanc", model: "Summit 2+" },
  { brand: "Motorola", model: "moto g52j 5G" },
  { brand: "Motorola", model: "moto g53y 5G" },
  { brand: "Motorola", model: "Motorola Razr 2022" },
  { brand: "Motorola", model: "Edge 40" },
  { brand: "Motorola", model: "Edge 40 Neo" },
  { brand: "Motorola", model: "Edge 40 Pro" },
  { brand: "Motorola", model: "Edge+ Plus" },
  { brand: "Motorola", model: "Edge+ Plus (2022)" },
  { brand: "Motorola", model: "Moto G53" },
  { brand: "Motorola", model: "Moto G53 5G" },
  { brand: "Motorola", model: "Moto G54" },
  { brand: "Motorola", model: "Motorola Razr" },
  { brand: "Motorola", model: "Motorola Razr 5G" },
  { brand: "Motorola", model: "Razr 2022" },
  { brand: "Motorola", model: "Razr 40 Ultra" },
  { brand: "Motorola Solutions", model: "MOTOTRBO ION" },
  { brand: "My phone", model: "Hammer Blade 3" },
  { brand: "My phone", model: "Hammer Explorer Pro" },
  { brand: "My phone", model: "myPhone Now eSIM" },
  { brand: "MyPhone (PL)", model: "Hammer_Explorer" },
  { brand: "Nokia", model: "Nokia G60 5G" },
  { brand: "Nokia", model: "Nokia X30 5G" },
  { brand: "Nokia", model: "XR21" },
  { brand: "Nothing", model: "Phone (3)" },
  { brand: "Nothing", model: "Phone Pro" },
  { brand: "OnePlus", model: "13R" },
  { brand: "OnePlus", model: "13T" },
  { brand: "OnePlus", model: "OnePlus 11 5G" },
  { brand: "OnePlus", model: "OnePlus 12" },
  { brand: "Oppo", model: "Find N5" },
  { brand: "Oppo", model: "Find X3 Pro" },
  { brand: "Oppo", model: "OPPO Watch" },
  { brand: "Oppo", model: "Reno14" },
  { brand: "Oppo", model: "Reno14 Pro" },
  { brand: "OPPO", model: "A5" },
  { brand: "OPPO", model: "A55s 5G" },
  { brand: "OPPO", model: "A77" },
  { brand: "OPPO", model: "CPH2247" },
  { brand: "OPPO", model: "Find N2 Flip" },
  { brand: "OPPO", model: "Find X5" },
  { brand: "OPPO", model: "Find X5 Pro" },
  { brand: "OPPO", model: "OPPO Reno5 A" },
  { brand: "OPPO", model: "OPPO Reno7 A" },
  { brand: "premier", model: "TAB-7304-16G3GS" },
  { brand: "Rakuten", model: "C330" },
  { brand: "Rakuten", model: "Rakuten BIG s" },
  { brand: "Rakuten", model: "Rakuten Hand" },
  { brand: "Rakuten", model: "Rakuten Hand5G" },
  { brand: "RAKUTEN", model: "AQUOS sense6" },
  { brand: "Razer", model: "Razer Edge 5G" },
  { brand: "RealMe", model: "14 Pro+" },
  { brand: "RealMe", model: "GT 7" },
  { brand: "RealMe", model: "RMX5070" },
  { brand: "Samsung", model: "Galaxy A23 5G" },
  { brand: "Samsung", model: "Galaxy S22" },
  { brand: "Samsung", model: "Galaxy S22 Ultra" },
  { brand: "Samsung", model: "Galaxy S22+" },
  { brand: "Samsung", model: "Galaxy S23" },
  { brand: "Samsung", model: "Galaxy S23 Ultra" },
  { brand: "Samsung", model: "Galaxy S23+" },
  { brand: "Samsung", model: "Galaxy Z Flip 4" },
  { brand: "Samsung", model: "Galaxy Z Fold4" },
  { brand: "Samsung", model: "A35" },
  { brand: "Samsung", model: "A36" },
  { brand: "Samsung", model: "Galaxy 24 FE" },
  { brand: "Samsung", model: "Galaxy A54 5G" },
  { brand: "Samsung", model: "Galaxy A55" },
  { brand: "Samsung", model: "Galaxy A56" },
  { brand: "Samsung", model: "Galaxy Flip 5" },
  { brand: "Samsung", model: "Galaxy Flip 7" },
  { brand: "Samsung", model: "Galaxy Fold 5" },
  { brand: "Samsung", model: "Galaxy Note20" },
  { brand: "Samsung", model: "Galaxy Note20 5G" },
  { brand: "Samsung", model: "Galaxy Note20 Ultra" },
  { brand: "Samsung", model: "Galaxy Note20 Ultra 5G" },
  { brand: "Samsung", model: "Galaxy S20 5G" },
  { brand: "Samsung", model: "Galaxy S20 Ultra 5G" },
  { brand: "Samsung", model: "Galaxy S20+ 5G" },
  { brand: "Samsung", model: "Galaxy S21 5G" },
  { brand: "Samsung", model: "Galaxy S21 Ultra 5G" },
  { brand: "Samsung", model: "Galaxy S21+ 5G" },
  { brand: "Samsung", model: "Galaxy S22 5G" },
  { brand: "Samsung", model: "Galaxy S22 Ultra 5G" },
  { brand: "Samsung", model: "Galaxy S22+ 5G" },
  { brand: "Samsung", model: "Galaxy S23 FE" },
  { brand: "Samsung", model: "Galaxy S24" },
  { brand: "Samsung", model: "Galaxy S24 Ultra" },
  { brand: "Samsung", model: "Galaxy S24+" },
  { brand: "Samsung", model: "Galaxy S25" },
  { brand: "Samsung", model: "Galaxy S25 Edge" },
  { brand: "Samsung", model: "Galaxy S25 Ultra" },
  { brand: "Samsung", model: "Galaxy S25+" },
  { brand: "Samsung", model: "Galaxy Watch4" },
  { brand: "Samsung", model: "Galaxy Watch4 Classic" },
  { brand: "Samsung", model: "Galaxy XCover7 Pro" },
  { brand: "Samsung", model: "Galaxy Z Flip" },
  { brand: "Samsung", model: "Galaxy Z Flip 5G" },
  { brand: "Samsung", model: "Galaxy Z Flip3 5G" },
  { brand: "Samsung", model: "Galaxy Z Flip 7 FE" },
  { brand: "Samsung", model: "Galaxy Z Fold" },
  { brand: "Samsung", model: "Galaxy Z Fold2" },
  { brand: "Samsung", model: "Galaxy Z Fold3" },
  { brand: "Samsung", model: "Galaxy Z Fold7" },
  { brand: "SG", model: "AQUOS R6" },
  { brand: "SG", model: "AQUOS R7" },
  { brand: "SG", model: "AQUOS sense7 plus" },
  { brand: "SG", model: "Leitz Phone 2" },
  { brand: "SG", model: "シンプルスマホ６" },
  { brand: "SGIN", model: "SGIN_E10M" },
  { brand: "Sharp", model: "AQUOS sense4 lite SH-RM15" },
  { brand: "Sharp", model: "Aquos Sense6" },
  { brand: "Sharp", model: "Aquos wish5" },
  { brand: "Sharp", model: "Aquos Wish6" },
  { brand: "Sharp", model: "Aquos Zero6" },
  { brand: "Sharp", model: "SH-51F" },
  { brand: "SHARP", model: "AQUOS wish" },
  { brand: "SHARP", model: "AQUOS zero6" },
  { brand: "Sony", model: "Exporia 1 VII" },
  { brand: "Sony", model: "Xperia 1 IV" },
  { brand: "Sony", model: "Xperia 1 V" },
  { brand: "Sony", model: "Xperia 10 III Lite" },
  { brand: "Sony", model: "Xperia 10 IV" },
  { brand: "Sony", model: "Xperia 5 IV" },
  { brand: "Sony", model: "Xperia Ace III" },
  { brand: "surface", model: "Surface Duo 2" },
  { brand: "Surface", model: "Surface Duo" },
  { brand: "Surface", model: "Surface Pro 9" },
  { brand: "TAG-TECH", model: "DAY-TAB-III" },
  { brand: "TCL", model: "60 XE NxtPaper" },
  { brand: "Teclast", model: "X_EEA" },
  { brand: "TONE", model: "TONE_e22" },
  { brand: "VIKUSHA", model: "V-Z40" },
  { brand: "in vivo", model: "V29" },
  { brand: "in vivo", model: "V29 Lite 5G" },
  { brand: "in vivo", model: "X100 Pro" },
  { brand: "in vivo", model: "X200s" },
  { brand: "in vivo", model: "X90 Pro" },
  { brand: "Vivo", model: "V40" },
  { brand: "Vivo", model: "V50" },
  { brand: "Vivo", model: "X200" },
  { brand: "Vivo", model: "X200 Pro" },
  { brand: "Vsmart", model: "Active 1" },
  { brand: "Xiaomi", model: "15 Ultra" },
  { brand: "Xiaomi", model: "Redmi Note 11 Pro 5G" },
  { brand: "Xiaomi", model: "Redmi Note 13 Pro" },
  { brand: "Xiaomi", model: "Redmi Note 13 Pro+" },
  { brand: "Xiaomi", model: "Redmi Note 14 Pro" },
  { brand: "Xiaomi", model: "Redmi Note 14 Pro 5G" },
  { brand: "Xiaomi", model: "Redmi Note 14 Pro+" },
  { brand: "Xiaomi", model: "Redmi Note 14 Pro+ 5G" },
  { brand: "Xiaomi", model: "Xiaomi 12T Pro" },
  { brand: "Xiaomi", model: "Xiaomi 13" },
  { brand: "Xiaomi", model: "Xiaomi 13 Lite" },
  { brand: "Xiaomi", model: "Xiaomi 13 Pro" },
  { brand: "Xiaomi", model: "Xiaomi 13T" },
  { brand: "Xiaomi", model: "Xiaomi 13T Pro" },
  { brand: "Xiaomi", model: "Xiaomi 14" },
  { brand: "Xiaomi", model: "Xiaomi 14 Pro" },
  { brand: "Xiaomi", model: "Xiaomi 14T" },
  { brand: "Xiaomi", model: "Xiaomi 14T Pro" },
  { brand: "Xiaomi", model: "Xiaomi 15" },
  { brand: "zebra", model: "EC55" },
  { brand: "zebra", model: "ET56" },
  { brand: "zebra", model: "TC26" },
  { brand: "zebra", model: "TC57" },
  { brand: "zebra", model: "TC58" },
  { brand: "zebra", model: "TC77" },
  { brand: "zebra", model: "Zebra Technologies L10" },
  { brand: "zebra", model: "Zebra Technologies MC2700" },
  { brand: "zebra", model: "Zebra Technologies TC57x" },
  { brand: "ZONKO", model: "K105_EEA" },
  { brand: "ZTE", model: "A103ZT" },
  { brand: "ZTE", model: "A202ZT" },
  { brand: "ZTE", model: "RAKUTEN BIG" },
  { brand: "ZTE", model: "ZR01" }
];

export const CompatibilityChecker = ({ open, onOpenChange }: CompatibilityCheckerProps) => {
  const { t } = useTranslation();
  const [iosSearch, setIosSearch] = useState("");
  const [androidSearch, setAndroidSearch] = useState("");

  const filteredIosDevices = iosDevices.filter(device =>
    device.toLowerCase().includes(iosSearch.toLowerCase())
  );

  const filteredAndroidDevices = androidDevices.filter(device =>
    `${device.brand} ${device.model}`.toLowerCase().includes(androidSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('checkDeviceCompatibility')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm leading-relaxed">
              {t('compatibilityIntro')}
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>{t('compatibilityCondition1')}</li>
              <li>{t('compatibilityCondition2')}</li>
              <li>{t('compatibilityCondition3')}</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              {t('compatibilityNote1')}
            </p>
            <p className="text-sm font-medium mt-2">
              {t('compatibilityNote2')}
            </p>
          </div>

          {/* iOS Devices */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{t('iosModels')}</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchDevices')}
                value={iosSearch}
                onChange={(e) => setIosSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 rounded-lg bg-muted/30 border">
              {filteredIosDevices.length > 0 ? (
                filteredIosDevices.map((device, index) => (
                  <div key={index} className="text-sm p-2 rounded bg-background/50">
                    {device}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-2">No devices found</p>
              )}
            </div>
          </div>

          {/* Android Devices */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{t('androidModels')}</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchDevices')}
                value={androidSearch}
                onChange={(e) => setAndroidSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 rounded-lg bg-muted/30 border">
              {filteredAndroidDevices.length > 0 ? (
                filteredAndroidDevices.map((device, index) => (
                  <div key={index} className="text-sm p-2 rounded bg-background/50">
                    <span className="font-medium">{device.brand}</span> - {device.model}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-2">No devices found</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
