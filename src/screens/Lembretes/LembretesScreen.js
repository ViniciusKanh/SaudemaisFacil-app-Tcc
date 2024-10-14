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
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome"; // Adicionando ícones de FontAwesome
import RemindersConsultationScreen from "./Consulta/RemindersConsultationScreen";
import RemindersMedicationScreen from "./Medicamento/RemindersMedicationScreen";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";

const LembretesScreen = ({ navigation }) => {
  const [isConsultationModalVisible, setConsultationModalVisible] = useState(false);
  const [isMedicationModalVisible, setMedicationModalVisible] = useState(false);
  const [isToleranceModalVisible, setToleranceModalVisible] = useState(false);
  const [tolerance, setTolerance] = useState("30"); // Estado para armazenar a tolerância, valor inicial 30 minutos

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
    Alert.alert("Tolerância", `Tolerância definida para ${tolerance} minutos.`);
    closeToleranceModal();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.cardTitle}>Medicamentos</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={openMedicationModal}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Lembrete Medicamento", { tolerance })}
          >
            <Text style={styles.buttonText}>Visualizar</Text>
          </TouchableOpacity>

          {/* Botão com ícone de engrenagem para configurar a tolerância */}
          <TouchableOpacity style={styles.button} onPress={openToleranceModal}>
            <Icon name="cog" size={20} color="#000" style={styles.icon} />
            <Text style={styles.buttonText}>Definir Tolerância</Text>
          </TouchableOpacity>
        </View>

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
            <TextInput
              style={styles.input}
              placeholder="Digite a tolerância"
              placeholderTextColor="#000" // Placeholder com letra preta
              keyboardType="numeric"
              value={tolerance}
              onChangeText={setTolerance}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleToleranceSubmit}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeToleranceModal}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    backgroundColor: "#f7f7f7", // Cor de fundo mais clara
  },
  content: {
    padding: 20,
    margin: 15,
  },
  card: {
    backgroundColor: "#e8f5e9",
    borderRadius: 15, // Borda mais arredondada
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#66bb6a", // Cor da borda mais clara
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2e7d32", // Texto com tom verde escuro
    textAlign: "center",
  },
  button: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#66bb6a",
    marginVertical: 10,
    width: "100%",
    flexDirection: "row", // Para alinhar o ícone ao texto
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    textAlign: "center",
    marginLeft: 10, // Espaço entre ícone e texto
  },
  icon: {
    position: "absolute",
    left: 20, // Alinhando o ícone à esquerda
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // Fundo semi-transparente
  },
  modalContainer: {
    width: 300,
    padding: 25,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2e7d32", // Título estilizado
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 20,
    textAlign: "center",
    color: "#000", // Cor do texto
  },
  saveButton: {
    backgroundColor: "#66bb6a",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ff7043",
    padding: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LembretesScreen;
