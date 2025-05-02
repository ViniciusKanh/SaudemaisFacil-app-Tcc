// GlicemiaScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Button,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";

const GlicemiaScreen = ({ closeModal }) => {
  const [glicemia, setGlicemia] = useState("");
  const [inJejum, setInJejum] = useState(false);
  const [humor, setHumor] = useState("");
  const [humores, setHumores] = useState([]);
  const [humorSelecionado, setHumorSelecionado] = useState("");

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchHumores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "humors"));
        const fetchedHumores = querySnapshot.docs.map((doc) => ({
          label: doc.data().humores, // 👈 Corrigido conforme Firebase
          value: doc.id,
        }));
        setHumores(fetchedHumores);
        console.log(fetchedHumores);
      } catch (error) {
        console.error("Erro ao buscar humores:", error);
        Alert.alert("Erro", "Não foi possível buscar os humores.");
      }
    };
  
    fetchHumores();
  }, []);

  const handleSalvarGlicemia = async () => {
    if (!user) {
      Alert.alert("Usuário não logado", "Você precisa estar logado para salvar a glicemia.");
      return;
    }
  
    if (!glicemia) {
      Alert.alert("Erro", "Por favor, insira o valor da glicemia.");
      return;
    }
  
    const selectedHumorObject = humores.find((h) => h.value === humorSelecionado);
  
    try {
      await addDoc(collection(db, "diabetes"), {
        Glicemia: glicemia,
        Infasting: inJejum,
        ID_user: user.uid,
        Datetime: serverTimestamp(),
        Humor: selectedHumorObject ? selectedHumorObject.label : "Não informado",
      });
      Alert.alert("Sucesso", "Glicemia salva com sucesso!");
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar os dados de glicemia:", error);
      Alert.alert("Erro", "Não foi possível salvar os dados de glicemia.");
    }
  };
  

  return (
    <View style={styles.centeredView}>
    <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Registro de Glicemia</Text>
          <Text>Glicemia (mg/dL)</Text>
          <TextInput
            style={styles.input}
            placeholder="Insira o Valor da Glicemia"
            placeholderTextColor="#999999" // Esta é a cor do placeholder
            keyboardType="numeric"
            value={glicemia}
            onChangeText={setGlicemia}
          />
          <View style={styles.switchContainer}>
            <Text>Em jejum?</Text>
            <Switch value={inJejum} onValueChange={setInJejum} />
          </View>
          <Text>Humor:</Text>
<View style={styles.pickerContainer}>
  <Picker
    selectedValue={humorSelecionado}
    onValueChange={(itemValue) => setHumorSelecionado(itemValue)}
    style={styles.pickerInterno}
  >
    <Picker.Item label="Selecione um humor..." value="" />
    {humores.map((humor) => (
      <Picker.Item key={humor.value} label={humor.label} value={humor.value} />
    ))}
  </Picker>
</View>



          <TouchableOpacity
            style={styles.buttonSalvar}
            onPress={handleSalvarGlicemia}
          >
            <Text style={styles.buttonTextSalvar}>Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonClose} onPress={closeModal}>
            <Text style={styles.buttonTextClose}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>

  );
};

// Estilos utilizados no GlicemiaScreen
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Fundo escuro translúcido
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",         // ✅ Mais largo em telas menores
    maxWidth: 600,        // ✅ Limite em tablets e desktops
  },
  modalTitle: {
    fontWeight: "bold", // Negrito
    fontSize: 22, // Tamanho da fonte maior
    marginBottom: 20, // Espaço abaixo do título
    textAlign: "center", // Centralizar texto
  },
  input: {
    height: 45, // Tamanho maior para fácil interação
    marginVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 20, // Fonte maior para melhor leitura
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginLeft: 0.5,
    marginBottom: 20,
    paddingVertical: 10, // Aumenta o espaço vertical dentro do contêiner
    paddingHorizontal: 30, // Espaço horizontal dentro do contêiner
    borderRadius: 40, // Cantos arredondados para a estética
    backgroundColor: "#ccc", // Cor de fundo cinza
    width: "80%", // Ocupa a largura toda do modal
  },
  buttonSalvar: {
    backgroundColor: "#34A853",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: "100%",
    marginTop: 10,
  },
  buttonTextSalvar: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
  buttonClose: {
    backgroundColor: "#D32F2F",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: "100%",
    marginTop: 10,
  },
  buttonTextClose: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginVertical: 12,
    width: "100%",
    overflow: "hidden",
  },
  pickerInterno: {
    width: "100%",
    color: "#000", // <- Corrigido: estava branco ("#ffffff") e sumia em fundo claro
  },
});

// Estilos para o RNPickerSelect
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 20,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginVertical: 12,
    width: "100%",
    overflow: "hidden",
  },
  pickerInterno: {
    width: "100%",
    color: "#000", // <- Corrigido: estava branco ("#ffffff") e sumia em fundo claro
  },
  
  
});

export default GlicemiaScreen;
