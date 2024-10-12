//LembreteScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import RemindersConsultationScreen from "./Consulta/RemindersConsultationScreen";
import RemindersMedicationScreen from "./Medicamento/RemindersMedicationScreen";

import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";

const LembretesScreen = ({ navigation }) => {
  const [isConsultationModalVisible, setConsultationModalVisible] = useState(false);
  const [isMedicationModalVisible, setMedicationModalVisible] = useState(false); // Estado para o modal de medicamentos

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Token de notificação:", token);
      }
    });
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notificação recebida:", notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Resposta de notificação:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const openConsultationModal = () => setConsultationModalVisible(true);
  const closeConsultationModal = () => setConsultationModalVisible(false);

  const openMedicationModal = () => setMedicationModalVisible(true); // Abre o modal de medicamentos
  const closeMedicationModal = () => setMedicationModalVisible(false); // Fecha o modal de medicamentos

  const navigateToRelReminders = () => navigation.navigate("Consultas");
  const navigateToRelRemindersMedication = () => navigation.navigate("Lembrete Medicamento");


  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Teste Imediato",
          body: "Esta é uma notificação de teste disparada imediatamente.",
          sound: 'default',
        },
        trigger: { seconds: 2 }, // Dispara após 2 segundos
      });

      Alert.alert("Notificação Teste", "Notificação de teste enviada!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar a notificação de teste!");
      console.error("Erro ao enviar notificação de teste:", error);
    }
  };

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
            onPress={navigateToRelRemindersMedication}
          >
            <Text style={styles.buttonText}>Visualizar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>Consultas</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.button} onPress={openConsultationModal}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={navigateToRelReminders}
          >
            <Text style={styles.buttonText}>Visualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RemindersConsultationScreen
        isVisible={isConsultationModalVisible}
        onClose={closeConsultationModal}
      />

      <RemindersMedicationScreen
        isVisible={isMedicationModalVisible} // Vincula ao estado de visibilidade
        onClose={closeMedicationModal} // Passa a função para fechar o modal
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#65BF85",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    padding: 20,
    margin: 15,
  },
  card: {
    backgroundColor: "#EDF3EF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#65BF85",
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000000",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#ffff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#65BF85",
    marginVertical: 10,
    width: "100%",
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    textAlign: "center",
  },
});

export default LembretesScreen;
