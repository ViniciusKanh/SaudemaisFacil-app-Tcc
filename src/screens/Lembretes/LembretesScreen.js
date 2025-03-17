import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome"; // Adicionando ícones de FontAwesome
import RemindersConsultationScreen from "./Consulta/RemindersConsultationScreen";
import RemindersMedicationScreen from "./Medicamento/RemindersMedicationScreen";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Picker } from "@react-native-picker/picker"; // Importando Picker

const LembretesScreen = ({ navigation }) => {
  const [isConsultationModalVisible, setConsultationModalVisible] = useState(false);
  const [isMedicationModalVisible, setMedicationModalVisible] = useState(false);
  const [isToleranceModalVisible, setToleranceModalVisible] = useState(false);
  const [tolerance, setTolerance] = useState("30"); // Estado para armazenar a tolerância, valor inicial 30 minutos
  const [selectedTolerance, setSelectedTolerance] = useState("30"); // Valor inicial (30 minutos)

  // Gerando as opções para o Picker
  const toleranceOptions = Array.from({ length: 138 }, (_, i) => (i + 1) * 10); // Incrementos de 10

  useEffect(() => {
    // Função de registro para notificações
    const registerForPushNotificationsAsync = async () => {
      let token;
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Falha ao obter permissão para notificações!');
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Token de notificação registrado:", token);
      } else {
        Alert.alert('Deve usar um dispositivo físico para Push Notifications');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    };

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("Token de notificação:", token);
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notificação recebida:", notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Resposta de notificação:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const openConsultationModal = () => setConsultationModalVisible(true);
  const closeConsultationModal = () => setConsultationModalVisible(false);

  const openMedicationModal = () => setMedicationModalVisible(true);
  const closeMedicationModal = () => setMedicationModalVisible(false);

  const openToleranceModal = () => setToleranceModalVisible(true);
  const closeToleranceModal = () => setToleranceModalVisible(false);

  const handleToleranceSubmit = () => {
    setTolerance(selectedTolerance); // Salva o valor selecionado
    Alert.alert("Tolerância", `Tolerância definida para ${selectedTolerance} minutos.`);
    closeToleranceModal();
  };
  
  

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        item.toString() === selectedTolerance && styles.selectedOptionButton,
      ]}
      onPress={() => setSelectedTolerance(item.toString())} // Atualiza o valor selecionado
    >
      <Text
        style={[
          styles.optionText,
          item.toString() === selectedTolerance && styles.selectedOptionText,
        ]}
      >
        {item} minutos
      </Text>
    </TouchableOpacity>
  );
  
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Seção de Medicamentos */}
        <Text style={styles.cardTitle}>Medicamentos</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={openMedicationModal}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate("RemindersMedicationView", { tolerance })} // Nome correto e parâmetros
>
  <Text style={styles.buttonText}>Visualizar</Text>
</TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={openToleranceModal}>
            <Icon name="cog" size={20} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>Definir Tolerância</Text>
          </TouchableOpacity>
        </View>
  
        {/* Seção de Consultas */}
        <Text style={styles.cardTitle}>Consultas</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={openConsultationModal}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Consultas")}
          >
            <Text style={styles.buttonText}>Visualizar</Text>
          </TouchableOpacity>
        </View>
      </View>
  
      {/* Modal de Tolerância */}
      <Modal visible={isToleranceModalVisible} animationType="slide" transparent={true}>
  <View style={styles.modalBackground}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Definir Tolerância (em minutos)</Text>

      {/* Picker estilizado */}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedTolerance}
          onValueChange={(itemValue) => setSelectedTolerance(itemValue)}
          style={styles.picker}
          itemStyle={styles.pickerItem} // Estilização dos itens
          mode="dialog"
        >
          {toleranceOptions.map((value) => (
            <Picker.Item
              key={value}
              label={`${value} minutos`}
              value={`${value}`}
              color={value === parseInt(selectedTolerance) ? "#2e7d32" : "#000"} // Destaque do selecionado
            />
          ))}
        </Picker>
      </View>

      {/* Botões de Ação */}
      <TouchableOpacity style={styles.saveButton} onPress={handleToleranceSubmit}>
        <Text style={styles.saveButtonText}>Salvar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeButton} onPress={closeToleranceModal}>
        <Text style={styles.closeButtonText}>Fechar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>





  
      {/* Modais de Consultas e Medicamentos */}
      <RemindersConsultationScreen
        isVisible={isConsultationModalVisible}
        onClose={closeConsultationModal}
      />
      <RemindersMedicationScreen
        isVisible={isMedicationModalVisible}
        onClose={closeMedicationModal}
      />
    </SafeAreaView>
  );
  
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
  },
  content: {
    padding: 20,
    margin: 15,
  },
  card: {
    backgroundColor: "#e8f5e9",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#66bb6a",
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2e7d32",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#66bb6a",
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    textAlign: "center",
    marginLeft: 10,
  },
  icon: {
    position: "absolute",
    left: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2e7d32",
    textAlign: "center",
  },
  selectedOption: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
  optionButton: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  selectedOptionButton: {
    backgroundColor: "#e0f2f1",
  },
  selectedOptionText: {
    color: "#00796b",
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Fundo escuro para destaque
  },
  modalContainer: {
    width: "95%", // Maior largura do modal
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    elevation: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerWrapper: {
    width: "100%",
    height: 200, // Aumenta a altura da área do Picker
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
    borderColor: "#2e7d32",
    borderRadius: 10,
    overflow: "hidden", // Corta bordas arredondadas
    marginBottom: 20,
  },
  picker: {
    width: "100%",
    height: "100%", // Expande o Picker dentro do wrapper
    color: "#000", // Fonte escura para os valores
  },
  pickerItem: {
    fontSize: 22, // Tamanho da fonte dos itens no Picker
    fontWeight: "bold",
    color: "#000", // Cor escura padrão
  },
  saveButton: {
    backgroundColor: "#66bb6a",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    elevation: 5, // Adiciona sombra
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ff7043",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});


export default LembretesScreen;