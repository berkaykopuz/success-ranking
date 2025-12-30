import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/userStore';
import { Save } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// TYT Dersleri
type TYTSectionKey = 'turkce' | 'matematik' | 'sosyal' | 'fen';

// AYT Dersleri
type AYTSectionKey = 
  | 'aytMatematik' 
  | 'aytFizik' | 'aytKimya' | 'aytBiyoloji'
  | 'aytEdebiyat' | 'aytTarih1' | 'aytCografya1'
  | 'aytTarih2' | 'aytCografya2' | 'aytFelsefe' | 'aytDin';

interface NetInputs {
  correct: string;
  wrong: string;
}

type TYTState = Record<TYTSectionKey, NetInputs>;
type AYTState = Record<AYTSectionKey, NetInputs>;

const INITIAL_TYT_STATE: TYTState = {
  turkce: { correct: '', wrong: '' },
  matematik: { correct: '', wrong: '' },
  sosyal: { correct: '', wrong: '' },
  fen: { correct: '', wrong: '' },
};

const INITIAL_AYT_STATE: AYTState = {
  aytMatematik: { correct: '', wrong: '' },
  aytFizik: { correct: '', wrong: '' },
  aytKimya: { correct: '', wrong: '' },
  aytBiyoloji: { correct: '', wrong: '' },
  aytEdebiyat: { correct: '', wrong: '' },
  aytTarih1: { correct: '', wrong: '' },
  aytCografya1: { correct: '', wrong: '' },
  aytTarih2: { correct: '', wrong: '' },
  aytCografya2: { correct: '', wrong: '' },
  aytFelsefe: { correct: '', wrong: '' },
  aytDin: { correct: '', wrong: '' },
};

const getNet = (inputs: NetInputs) => {
  const d = parseFloat(inputs.correct.replace(',', '.')) || 0;
  const y = parseFloat(inputs.wrong.replace(',', '.')) || 0;
  const net = d - y / 4;
  return net < 0 ? 0 : net;
};

// 2025 YKS Katsayı Tablosu
// TYT Ham Puan: 145.47 + (TrNet * 2.83) + (SosNet * 2.99) + (MatNet * 3.28) + (FenNet * 2.53)
const calculateTYTHamPuan = (
  turkceNet: number,
  matNet: number,
  sosyalNet: number,
  fenNet: number
) => {
  const base = 145.47;
  return base + 
    (turkceNet * 2.83) + 
    (sosyalNet * 2.99) + 
    (matNet * 3.28) + 
    (fenNet * 2.53);
};

// SAY Ham Puan: 132.87 + TYT Katkısı + AYT Katkısı
// TYT Katkısı: (TrNet * 1.20) + (SosNet * 1.27) + (MatNet * 1.39) + (FenNet * 1.07)
// AYT Katkısı: (AYT Mat * 2.89) + (Fizik * 2.46) + (Kimya * 2.53) + (Biyoloji * 2.61)
const calculateSAYHamPuan = (
  turkceNet: number,
  matNet: number,
  sosyalNet: number,
  fenNet: number,
  aytMatNet: number,
  fizikNet: number,
  kimyaNet: number,
  biyolojiNet: number
) => {
  const base = 132.87;
  const tytKatkisi = 
    (turkceNet * 1.20) + 
    (sosyalNet * 1.27) + 
    (matNet * 1.39) + 
    (fenNet * 1.07);
  const aytKatkisi = 
    (aytMatNet * 2.89) + 
    (fizikNet * 2.46) + 
    (kimyaNet * 2.53) + 
    (biyolojiNet * 2.61);
  return base + tytKatkisi + aytKatkisi;
};

// EA Ham Puan: 129.34 + TYT Katkısı + AYT Katkısı
// TYT Katkısı: (TrNet * 1.19) + (SosNet * 1.26) + (MatNet * 1.38) + (FenNet * 1.07)
// AYT Katkısı: (AYT Mat * 2.88) + (Edebiyat * 2.94) + (Tarih1 * 2.53) + (Cog1 * 2.85)
const calculateEAHamPuan = (
  turkceNet: number,
  matNet: number,
  sosyalNet: number,
  fenNet: number,
  aytMatNet: number,
  edebiyatNet: number,
  tarih1Net: number,
  cografya1Net: number
) => {
  const base = 129.34;
  const tytKatkisi = 
    (turkceNet * 1.19) + 
    (sosyalNet * 1.26) + 
    (matNet * 1.38) + 
    (fenNet * 1.07);
  const aytKatkisi = 
    (aytMatNet * 2.88) + 
    (edebiyatNet * 2.94) + 
    (tarih1Net * 2.53) + 
    (cografya1Net * 2.85);
  return base + tytKatkisi + aytKatkisi;
};

// SÖZ Ham Puan: 129.61 + TYT Katkısı + AYT Katkısı
// TYT Katkısı: (TrNet * 1.13) + (SosNet * 1.19) + (MatNet * 1.31) + (FenNet * 1.01)
// AYT Katkısı: (Edebiyat * 2.79) + (Tarih1 * 2.39) + (Cog1 * 2.70) + (Tarih2 * 3.80) + (Cog2 * 2.47) + (Felsefe * 3.76) + (Din * 2.36)
const calculateSOZHamPuan = (
  turkceNet: number,
  matNet: number,
  sosyalNet: number,
  fenNet: number,
  edebiyatNet: number,
  tarih1Net: number,
  cografya1Net: number,
  tarih2Net: number,
  cografya2Net: number,
  felsefeNet: number,
  dinNet: number
) => {
  const base = 129.61;
  const tytKatkisi = 
    (turkceNet * 1.13) + 
    (sosyalNet * 1.19) + 
    (matNet * 1.31) + 
    (fenNet * 1.01);
  const aytKatkisi = 
    (edebiyatNet * 2.79) + 
    (tarih1Net * 2.39) + 
    (cografya1Net * 2.70) + 
    (tarih2Net * 3.80) + 
    (cografya2Net * 2.47) + 
    (felsefeNet * 3.76) + 
    (dinNet * 2.36);
  return base + tytKatkisi + aytKatkisi;
};

export default function YksNetScreen() {
  const insets = useSafeAreaInsets();
  const { saveYKSCalculation } = useUserStore();
  const [tytValues, setTytValues] = useState<TYTState>(INITIAL_TYT_STATE);
  const [aytValues, setAytValues] = useState<AYTState>(INITIAL_AYT_STATE);
  const [diplomaGrade, setDiplomaGrade] = useState('');
  const [kirikOBP, setKirikOBP] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [calculationName, setCalculationName] = useState('');

  const handleTytChange = (key: TYTSectionKey, field: keyof NetInputs, text: string) => {
    setTytValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: text.replace(/[^0-9,\.]/g, ''),
      },
    }));
  };

  const handleAytChange = (key: AYTSectionKey, field: keyof NetInputs, text: string) => {
    setAytValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: text.replace(/[^0-9,\.]/g, ''),
      },
    }));
  };

  const handleDiplomaChange = (text: string) => {
    const cleaned = text.replace(/[^0-9,\.]/g, '');
    const num = parseFloat(cleaned.replace(',', '.')) || 0;
    if (num <= 100) {
      setDiplomaGrade(cleaned);
    }
  };

  // TYT Netleri
  const turkceNet = useMemo(() => getNet(tytValues.turkce), [tytValues.turkce]);
  const matematikNet = useMemo(() => getNet(tytValues.matematik), [tytValues.matematik]);
  const sosyalNet = useMemo(() => getNet(tytValues.sosyal), [tytValues.sosyal]);
  const fenNet = useMemo(() => getNet(tytValues.fen), [tytValues.fen]);
  const tytTotalNet = useMemo(() => turkceNet + matematikNet + sosyalNet + fenNet, [turkceNet, matematikNet, sosyalNet, fenNet]);

  // AYT Netleri
  const aytMatNet = useMemo(() => getNet(aytValues.aytMatematik), [aytValues.aytMatematik]);
  const aytFizikNet = useMemo(() => getNet(aytValues.aytFizik), [aytValues.aytFizik]);
  const aytKimyaNet = useMemo(() => getNet(aytValues.aytKimya), [aytValues.aytKimya]);
  const aytBiyolojiNet = useMemo(() => getNet(aytValues.aytBiyoloji), [aytValues.aytBiyoloji]);
  const aytEdebiyatNet = useMemo(() => getNet(aytValues.aytEdebiyat), [aytValues.aytEdebiyat]);
  const aytTarih1Net = useMemo(() => getNet(aytValues.aytTarih1), [aytValues.aytTarih1]);
  const aytCografya1Net = useMemo(() => getNet(aytValues.aytCografya1), [aytValues.aytCografya1]);
  const aytTarih2Net = useMemo(() => getNet(aytValues.aytTarih2), [aytValues.aytTarih2]);
  const aytCografya2Net = useMemo(() => getNet(aytValues.aytCografya2), [aytValues.aytCografya2]);
  const aytFelsefeNet = useMemo(() => getNet(aytValues.aytFelsefe), [aytValues.aytFelsefe]);
  const aytDinNet = useMemo(() => getNet(aytValues.aytDin), [aytValues.aytDin]);

  // AYT Total Netleri
  const aytSayTotalNet = useMemo(
    () => aytMatNet + aytFizikNet + aytKimyaNet + aytBiyolojiNet,
    [aytMatNet, aytFizikNet, aytKimyaNet, aytBiyolojiNet]
  );
  const aytEaTotalNet = useMemo(
    () => aytMatNet + aytEdebiyatNet + aytTarih1Net + aytCografya1Net,
    [aytMatNet, aytEdebiyatNet, aytTarih1Net, aytCografya1Net]
  );
  const aytSozTotalNet = useMemo(
    () => aytEdebiyatNet + aytTarih1Net + aytCografya1Net + aytTarih2Net + aytCografya2Net + aytFelsefeNet + aytDinNet,
    [aytEdebiyatNet, aytTarih1Net, aytCografya1Net, aytTarih2Net, aytCografya2Net, aytFelsefeNet, aytDinNet]
  );

  // Baraj kontrolü
  const passesBaraj = useMemo(() => {
    return turkceNet >= 0.5 || matematikNet >= 0.5;
  }, [turkceNet, matematikNet]);

  // TYT Ham Puan
  const tytHamPuan = useMemo(() => {
    if (!passesBaraj) return 0;
    return calculateTYTHamPuan(turkceNet, matematikNet, sosyalNet, fenNet);
  }, [passesBaraj, turkceNet, matematikNet, sosyalNet, fenNet]);

  // AYT Ham Puanları (2025 formülü)
  const sayHamPuan = useMemo(() => {
    if (!passesBaraj) return 0;
    return calculateSAYHamPuan(
      turkceNet,
      matematikNet,
      sosyalNet,
      fenNet,
      aytMatNet,
      aytFizikNet,
      aytKimyaNet,
      aytBiyolojiNet
    );
  }, [passesBaraj, turkceNet, matematikNet, sosyalNet, fenNet, aytMatNet, aytFizikNet, aytKimyaNet, aytBiyolojiNet]);

  const eaHamPuan = useMemo(() => {
    if (!passesBaraj) return 0;
    return calculateEAHamPuan(
      turkceNet,
      matematikNet,
      sosyalNet,
      fenNet,
      aytMatNet,
      aytEdebiyatNet,
      aytTarih1Net,
      aytCografya1Net
    );
  }, [passesBaraj, turkceNet, matematikNet, sosyalNet, fenNet, aytMatNet, aytEdebiyatNet, aytTarih1Net, aytCografya1Net]);

  const sozHamPuan = useMemo(() => {
    if (!passesBaraj) return 0;
    return calculateSOZHamPuan(
      turkceNet,
      matematikNet,
      sosyalNet,
      fenNet,
      aytEdebiyatNet,
      aytTarih1Net,
      aytCografya1Net,
      aytTarih2Net,
      aytCografya2Net,
      aytFelsefeNet,
      aytDinNet
    );
  }, [passesBaraj, turkceNet, matematikNet, sosyalNet, fenNet, aytEdebiyatNet, aytTarih1Net, aytCografya1Net, aytTarih2Net, aytCografya2Net, aytFelsefeNet, aytDinNet]);

  // Diploma notu
  const diplomaNotu = useMemo(() => {
    return parseFloat(diplomaGrade.replace(',', '.')) || 0;
  }, [diplomaGrade]);

  // OBP katsayısı (Kırık OBP ise 0.3, değilse 0.6)
  const obpKatsayisi = useMemo(() => {
    return kirikOBP ? 0.3 : 0.6;
  }, [kirikOBP]);

  // OBP ek puanı
  const obpEkPuan = useMemo(() => {
    return diplomaNotu * obpKatsayisi;
  }, [diplomaNotu, obpKatsayisi]);

  // Yerleştirme Puanları (Ham Puan + Diploma Notu * Katsayı)
  const tytYerlesme = useMemo(() => tytHamPuan + obpEkPuan, [tytHamPuan, obpEkPuan]);
  const sayYerlesme = useMemo(() => sayHamPuan + obpEkPuan, [sayHamPuan, obpEkPuan]);
  const eaYerlesme = useMemo(() => eaHamPuan + obpEkPuan, [eaHamPuan, obpEkPuan]);
  const sozYerlesme = useMemo(() => sozHamPuan + obpEkPuan, [sozHamPuan, obpEkPuan]);

  const handleSave = () => {
    if (!passesBaraj) {
      Alert.alert('Uyarı', 'TYT puanının hesaplanması için Türkçe veya Matematik\'ten en az 0,5 net gerekir.');
      return;
    }
    setIsSaveModalVisible(true);
  };

  const handleConfirmSave = () => {
    if (!calculationName.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir isim girin.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveYKSCalculation({
      name: calculationName.trim(),
      tytValues,
      aytValues,
      diplomaGrade,
      kirikOBP,
      tytHamPuan,
      sayHamPuan,
      eaHamPuan,
      sozHamPuan,
      tytYerlesme,
      sayYerlesme,
      eaYerlesme,
      sozYerlesme,
    });

    Alert.alert('Başarılı', 'Hesaplama kaydedildi!', [
      {
        text: 'Tamam',
        onPress: () => {
          setIsSaveModalVisible(false);
          setCalculationName('');
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-4 border-b border-slate-100">
        <Text className="text-3xl font-bold text-slate-800 tracking-tight">YKS Puan Hesaplama</Text>
        <Text className="text-sm text-slate-500 mt-1">
          2025 YKS Puan Hesaplama - Hassas katsayı tablosu
        </Text>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* TYT Card */}
        <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="bg-blue-50 px-2.5 py-1 rounded-md mr-2">
                <Text className="text-blue-700 font-bold text-[10px] tracking-wider uppercase">TYT</Text>
              </View>
              <Text className="text-lg font-bold text-slate-800">Temel Yeterlilik Testi</Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] text-slate-400 font-medium">120 soru • 165 dk</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 mb-4 ml-0">
            Başlangıç: 145.47 | 2025 katsayıları
          </Text>

          <SectionRow
            label="Türkçe"
            help="40 soru • Katsayı: 2.83"
            value={tytValues.turkce}
            onChangeCorrect={(t) => handleTytChange('turkce', 'correct', t)}
            onChangeWrong={(t) => handleTytChange('turkce', 'wrong', t)}
          />
          <SectionRow
            label="Temel Matematik"
            help="40 soru • Katsayı: 3.28"
            value={tytValues.matematik}
            onChangeCorrect={(t) => handleTytChange('matematik', 'correct', t)}
            onChangeWrong={(t) => handleTytChange('matematik', 'wrong', t)}
          />
          <SectionRow
            label="Sosyal Bilimler"
            help="20 soru • Katsayı: 2.99"
            value={tytValues.sosyal}
            onChangeCorrect={(t) => handleTytChange('sosyal', 'correct', t)}
            onChangeWrong={(t) => handleTytChange('sosyal', 'wrong', t)}
          />
          <SectionRow
            label="Fen Bilimleri"
            help="20 soru • Katsayı: 2.53"
            value={tytValues.fen}
            onChangeCorrect={(t) => handleTytChange('fen', 'correct', t)}
            onChangeWrong={(t) => handleTytChange('fen', 'wrong', t)}
          />

          <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam TYT Net</Text>
              <Text className="text-lg font-bold text-blue-600 tracking-tight">
                {tytTotalNet.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>
        </View>

        {/* AYT Sayısal Card */}
        <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="bg-emerald-50 px-2.5 py-1 rounded-md mr-2">
                <Text className="text-emerald-700 font-bold text-[10px] tracking-wider uppercase">SAY</Text>
              </View>
              <Text className="text-lg font-bold text-slate-800">Sayısal Alan</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 mb-4 ml-0">
            Başlangıç: 132.87 | 2025 katsayıları
          </Text>

          <SectionRow
            label="AYT Matematik"
            help="Katsayı: 2.89"
            value={aytValues.aytMatematik}
            onChangeCorrect={(t) => handleAytChange('aytMatematik', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytMatematik', 'wrong', t)}
          />
          <SectionRow
            label="Fizik"
            help="Katsayı: 2.46"
            value={aytValues.aytFizik}
            onChangeCorrect={(t) => handleAytChange('aytFizik', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytFizik', 'wrong', t)}
          />
          <SectionRow
            label="Kimya"
            help="Katsayı: 2.53"
            value={aytValues.aytKimya}
            onChangeCorrect={(t) => handleAytChange('aytKimya', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytKimya', 'wrong', t)}
          />
          <SectionRow
            label="Biyoloji"
            help="Katsayı: 2.61"
            value={aytValues.aytBiyoloji}
            onChangeCorrect={(t) => handleAytChange('aytBiyoloji', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytBiyoloji', 'wrong', t)}
          />

          <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
              <Text className="text-lg font-bold text-emerald-600 tracking-tight">
                {aytSayTotalNet.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>
        </View>

        {/* AYT Eşit Ağırlık Card */}
        <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="bg-purple-50 px-2.5 py-1 rounded-md mr-2">
                <Text className="text-purple-700 font-bold text-[10px] tracking-wider uppercase">EA</Text>
              </View>
              <Text className="text-lg font-bold text-slate-800">Eşit Ağırlık Alan</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 mb-4 ml-0">
            Başlangıç: 129.34 | 2025 katsayıları
          </Text>

          <SectionRow
            label="AYT Matematik"
            help="Katsayı: 2.88"
            value={aytValues.aytMatematik}
            onChangeCorrect={(t) => handleAytChange('aytMatematik', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytMatematik', 'wrong', t)}
          />
          <SectionRow
            label="Edebiyat"
            help="Katsayı: 2.94"
            value={aytValues.aytEdebiyat}
            onChangeCorrect={(t) => handleAytChange('aytEdebiyat', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytEdebiyat', 'wrong', t)}
          />
          <SectionRow
            label="Tarih-1"
            help="Katsayı: 2.53"
            value={aytValues.aytTarih1}
            onChangeCorrect={(t) => handleAytChange('aytTarih1', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytTarih1', 'wrong', t)}
          />
          <SectionRow
            label="Coğrafya-1"
            help="Katsayı: 2.85"
            value={aytValues.aytCografya1}
            onChangeCorrect={(t) => handleAytChange('aytCografya1', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytCografya1', 'wrong', t)}
          />

          <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
              <Text className="text-lg font-bold text-purple-600 tracking-tight">
                {aytEaTotalNet.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>
        </View>

        {/* AYT Sözel Card */}
        <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="bg-orange-50 px-2.5 py-1 rounded-md mr-2">
                <Text className="text-orange-700 font-bold text-[10px] tracking-wider uppercase">SÖZ</Text>
              </View>
              <Text className="text-lg font-bold text-slate-800">Sözel Alan</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 mb-4 ml-0">
            Başlangıç: 129.61 | 2025 katsayıları
          </Text>

          <SectionRow
            label="Edebiyat"
            help="Katsayı: 2.79"
            value={aytValues.aytEdebiyat}
            onChangeCorrect={(t) => handleAytChange('aytEdebiyat', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytEdebiyat', 'wrong', t)}
          />
          <SectionRow
            label="Tarih-1"
            help="Katsayı: 2.39"
            value={aytValues.aytTarih1}
            onChangeCorrect={(t) => handleAytChange('aytTarih1', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytTarih1', 'wrong', t)}
          />
          <SectionRow
            label="Coğrafya-1"
            help="Katsayı: 2.70"
            value={aytValues.aytCografya1}
            onChangeCorrect={(t) => handleAytChange('aytCografya1', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytCografya1', 'wrong', t)}
          />
          <SectionRow
            label="Tarih-2"
            help="Katsayı: 3.80"
            value={aytValues.aytTarih2}
            onChangeCorrect={(t) => handleAytChange('aytTarih2', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytTarih2', 'wrong', t)}
          />
          <SectionRow
            label="Coğrafya-2"
            help="Katsayı: 2.47"
            value={aytValues.aytCografya2}
            onChangeCorrect={(t) => handleAytChange('aytCografya2', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytCografya2', 'wrong', t)}
          />
          <SectionRow
            label="Felsefe Grubu"
            help="Katsayı: 3.76"
            value={aytValues.aytFelsefe}
            onChangeCorrect={(t) => handleAytChange('aytFelsefe', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytFelsefe', 'wrong', t)}
          />
          <SectionRow
            label="Din Kültürü"
            help="Katsayı: 2.36"
            value={aytValues.aytDin}
            onChangeCorrect={(t) => handleAytChange('aytDin', 'correct', t)}
            onChangeWrong={(t) => handleAytChange('aytDin', 'wrong', t)}
          />

          <View className="mt-4 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Toplam AYT Net</Text>
              <Text className="text-lg font-bold text-orange-600 tracking-tight">
                {aytSozTotalNet.toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>
        </View>

        {/* OBP Input Card */}
        <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
          <View className="flex-row items-center mb-3">
            <View className="bg-indigo-50 px-2.5 py-1 rounded-md mr-2">
              <Text className="text-indigo-700 font-bold text-[10px] tracking-wider uppercase">OBP</Text>
            </View>
            <Text className="text-lg font-bold text-slate-800">Diploma Notu</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm font-medium text-slate-800 mb-2">Diploma Notu (50-100)</Text>
            <TextInput
              keyboardType="numeric"
              value={diplomaGrade}
              onChangeText={handleDiplomaChange}
              placeholder="Örn: 85"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 font-medium"
            />
          </View>

          <View className="mb-2">
            <TouchableOpacity
              className="flex-row items-center mb-2"
              onPress={() => setKirikOBP(!kirikOBP)}
              activeOpacity={0.7}
            >
              <View
                className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                  kirikOBP ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                }`}
              >
                {kirikOBP && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-sm text-slate-700">Kırık OBP (0.3 katsayı)</Text>
            </TouchableOpacity>
            <Text className="text-xs text-slate-500">
              Yerleştirme Puanı = Ham Puan + (Diploma Notu × {obpKatsayisi.toFixed(1)})
            </Text>
          </View>

          {obpEkPuan > 0 && (
            <View className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">OBP Ek Puanı</Text>
                <Text className="text-lg font-bold text-indigo-600 tracking-tight">
                  {obpEkPuan.toFixed(1).replace('.', ',')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Results Card */}
        <View className="bg-white p-5 mb-1 rounded-2xl border border-slate-100 shadow-sm mx-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-slate-900 px-2.5 py-1 rounded-md mr-2">
                <Text className="text-white font-bold text-[10px] tracking-wider uppercase">Sonuçlar</Text>
              </View>
              {!passesBaraj && (
                <View className="bg-red-50 px-2 py-0.5 rounded-md">
                  <Text className="text-red-700 font-bold text-[9px]">Baraj Yok</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleSave}
              className="bg-blue-600 px-4 py-2 rounded-xl flex-row items-center"
              activeOpacity={0.7}
            >
              <Save size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text className="text-white font-semibold text-sm">Kaydet</Text>
            </TouchableOpacity>
          </View>

          {/* TYT Results */}
          <View className="mb-4">
            <Text className="text-sm font-bold text-slate-800 mb-2">TYT Puanı</Text>
            <View className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-blue-600 font-medium">Ham Puan</Text>
                <Text className="text-base font-bold text-blue-700">
                  {passesBaraj ? tytHamPuan.toFixed(1).replace('.', ',') : '—'}
                </Text>
              </View>
              {diplomaNotu > 0 && (
                <View className="flex-row items-center justify-between pt-1 border-t border-blue-200">
                  <Text className="text-xs text-blue-600 font-medium">Yerleştirme Puanı</Text>
                  <Text className="text-base font-bold text-blue-700">
                    {tytYerlesme.toFixed(1).replace('.', ',')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* SAY Results */}
          <View className="mb-4">
            <Text className="text-sm font-bold text-slate-800 mb-2">SAY (Sayısal) Puanı</Text>
            <View className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-emerald-600 font-medium">Ham Puan</Text>
                <Text className="text-base font-bold text-emerald-700">
                  {passesBaraj && (aytMatNet > 0 || aytFizikNet > 0 || aytKimyaNet > 0 || aytBiyolojiNet > 0) 
                    ? sayHamPuan.toFixed(1).replace('.', ',') 
                    : '—'}
                </Text>
              </View>
              {diplomaNotu > 0 && (
                <View className="flex-row items-center justify-between pt-1 border-t border-emerald-200">
                  <Text className="text-xs text-emerald-600 font-medium">Yerleştirme Puanı</Text>
                  <Text className="text-base font-bold text-emerald-700">
                    {sayYerlesme.toFixed(1).replace('.', ',')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* EA Results */}
          <View className="mb-4">
            <Text className="text-sm font-bold text-slate-800 mb-2">EA (Eşit Ağırlık) Puanı</Text>
            <View className="bg-purple-50 px-3 py-2 rounded-xl border border-purple-200">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-purple-600 font-medium">Ham Puan</Text>
                <Text className="text-base font-bold text-purple-700">
                  {passesBaraj && (aytMatNet > 0 || aytEdebiyatNet > 0 || aytTarih1Net > 0 || aytCografya1Net > 0)
                    ? eaHamPuan.toFixed(1).replace('.', ',')
                    : '—'}
                </Text>
              </View>
              {diplomaNotu > 0 && (
                <View className="flex-row items-center justify-between pt-1 border-t border-purple-200">
                  <Text className="text-xs text-purple-600 font-medium">Yerleştirme Puanı</Text>
                  <Text className="text-base font-bold text-purple-700">
                    {eaYerlesme.toFixed(1).replace('.', ',')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* SÖZ Results */}
          <View className="mb-2">
            <Text className="text-sm font-bold text-slate-800 mb-2">SÖZ (Sözel) Puanı</Text>
            <View className="bg-orange-50 px-3 py-2 rounded-xl border border-orange-200">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs text-orange-600 font-medium">Ham Puan</Text>
                <Text className="text-base font-bold text-orange-700">
                  {passesBaraj && (aytEdebiyatNet > 0 || aytTarih1Net > 0 || aytCografya1Net > 0)
                    ? sozHamPuan.toFixed(1).replace('.', ',')
                    : '—'}
                </Text>
              </View>
              {diplomaNotu > 0 && (
                <View className="flex-row items-center justify-between pt-1 border-t border-orange-200">
                  <Text className="text-xs text-orange-600 font-medium">Yerleştirme Puanı</Text>
                  <Text className="text-base font-bold text-orange-700">
                    {sozYerlesme.toFixed(1).replace('.', ',')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="mt-4 pt-3 border-t border-slate-200">
            <Text className="text-[10px] text-slate-400 text-center leading-relaxed">
              ⚠️ TYT puanının hesaplanması için Türkçe veya Matematik&apos;ten en az 0,5 net gerekir.{'\n'}
              Hesaplama 2025 katsayı verilerine göre yapılmıştır.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Modal */}
      <Modal
        visible={isSaveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSaveModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-5"
          onPress={() => setIsSaveModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-2xl font-bold text-slate-800 mb-4">
              Hesaplamayı Kaydet
            </Text>
            <Text className="text-sm text-slate-600 mb-4">
              Bu hesaplamayı &quot;Geçmiş Netlerim&quot; bölümünde görüntülemek için bir isim verin.
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-800 mb-4"
              placeholder="Örn: Deneme Sınavı 1"
              value={calculationName}
              onChangeText={setCalculationName}
              placeholderTextColor="#94a3b8"
              autoFocus
              onSubmitEditing={handleConfirmSave}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setIsSaveModalVisible(false);
                  setCalculationName('');
                }}
                className="flex-1 bg-slate-100 rounded-xl py-3 items-center"
              >
                <Text className="text-slate-700 font-semibold">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmSave}
                disabled={!calculationName.trim()}
                className={`flex-1 rounded-xl py-3 items-center ${
                  calculationName.trim() ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <Text className="text-white font-semibold">Kaydet</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

interface SectionRowProps {
  label: string;
  help?: string;
  value: NetInputs;
  onChangeCorrect: (t: string) => void;
  onChangeWrong: (t: string) => void;
}

function SectionRow({ label, help, value, onChangeCorrect, onChangeWrong }: SectionRowProps) {
  const net = getNet(value);

  return (
    <View className="mb-3 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 last:mb-0">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-slate-800">{label}</Text>
        {help && (
          <Text className="text-xs text-slate-400 font-medium text-right max-w-[140px]">{help}</Text>
        )}
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Doğru</Text>
          <TextInput
            keyboardType="numeric"
            value={value.correct}
            onChangeText={onChangeCorrect}
            placeholder="0"
            placeholderTextColor="#94a3b8"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-medium"
          />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Yanlış</Text>
          <TextInput
            keyboardType="numeric"
            value={value.wrong}
            onChangeText={onChangeWrong}
            placeholder="0"
            placeholderTextColor="#94a3b8"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-medium"
          />
        </View>
        <View className="w-20 items-center justify-center">
          <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Net</Text>
          <View className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 w-full items-center">
            <Text className="text-sm font-semibold text-blue-700">{net.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
