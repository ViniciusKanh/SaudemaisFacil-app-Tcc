import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Notifications from "expo-notifications";

const initialState = {
  typeConsultation: { id: "", name: "" },
  warningHours: "",
  location: "",
  specialist: "",
  specialty: "",
  date: new Date(),
  isDatePickerVisible: false,
  isTimePickerVisible: false,
  typeOptions: [],
};

const RemindersConsultationScreen = ({ isVisible, onClose }) => {
  const [state, setState] = useState(initialState);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (isVisible) {
      fetchTypeConsultation();
    }
  }, [isVisible]);

  const fetchTypeConsultation = async () => {
    const querySnapshot = await getDocs(collection(db, "TypeConsultation"));
    const fetchedTypes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().type,
    }));
    setState((prev) => ({ ...prev, typeOptions: fetchedTypes }));
  };

  const showDatePicker = () => {
    setState((prev) => ({ ...prev, isDatePickerVisible: true }));
  };

  const hideDatePicker = () => {
    setState((prev) => ({ ...prev, isDatePickerVisible: false }));
  };

  const handleConfirmDate = (selectedDate) => {
    setState((prev) => ({
      ...prev,
      date: selectedDate,
      isDatePickerVisible: false,
    }));
  };

  const showTimePicker = () => {
    setState((prev) => ({ ...prev, isTimePickerVisible: true }));
  };

  const hideTimePicker = () => {
    setState((prev) => ({ ...prev, isTimePickerVisible: false }));
  };

  const handleConfirmTime = (selectedTime) => {
    const currentDate = new Date(state.date);
    currentDate.setHours(selectedTime.getHours());
    currentDate.setMinutes(selectedTime.getMinutes());
    setState((prev) => ({
      ...prev,
      date: currentDate,
      isTimePickerVisible: false,
    }));
  };

  const handleSaveReminder = async () => {
    if (!user) {
      alert("Usuário não está logado.");
      return;
    }

    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      const newPermission = await Notifications.requestPermissionsAsync();
      if (!newPermission.granted) {
        alert("Permissão de notificação negada. O lembrete não poderá ser notificado.");
        return;
      }
    }

    const formattedDateTime = state.date.toISOString();
    try {
      const deviceToken = await Notifications.getExpoPushTokenAsync();
      await addDoc(collection(db, "remindersConsultation"), {
        ID_user: user.uid,
        Type: state.typeConsultation.id,
        TypeName: state.typeConsultation.name,
        date_time: formattedDateTime,
        location: state.location,
        specialist: state.specialist,
        specialty: state.specialty,
        WarningHours: Number(state.warningHours),
        Status: 0,
        deviceToken: deviceToken,
      });

      const notificationTime = new Date(state.date);
      notificationTime.setHours(notificationTime.getHours() - state.warningHours);

      if (notificationTime > new Date()) {
        const scheduledNotification = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Lembrete de Consulta",
            body: `Sua consulta com ${state.specialist} em ${state.location} está agendada para ${formatDateDisplay(state.date)}. Notificação com ${state.warningHours} horas de antecedência.`,
            sound: "default",
          },
          trigger: notificationTime,
        });

        console.log("Notificação agendada:", scheduledNotification);
        alert("Lembrete salvo e notificação agendada com sucesso!");
      } else {
        alert("A data e hora do lembrete já passaram, ajuste para um momento futuro.");
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar lembrete: ", error);
      alert("Erro ao salvar lembrete.");
    }
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const resetForm = () => {
    setState({
      ...initialState,
      date: new Date(),
      typeOptions: state.typeOptions,
    });
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <KeyboardAwareScrollView extraScrollHeight={20}>
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.modalTitle}>Adicionar Novo Lembrete</Text>
            <Picker
              selectedValue={state.typeConsultation.id}
              onValueChange={(itemValue) => {
                const selectedType = state.typeOptions.find((option) => option.id === itemValue);
                setState((prev) => ({
                  ...prev,
                  typeConsultation: { id: itemValue, name: selectedType.name },
                }));
              }}
              style={styles.picker}
            >
              {state.typeOptions.map((option) => (
                <Picker.Item key={option.id} label={option.name} value={option.id} />
              ))}
            </Picker>
            <View style={styles.dateTimeWrapper}>
              <TouchableOpacity onPress={showDatePicker} style={styles.dateTimeButton}>
                <Text style={styles.dateTimeText}>Escolher Data</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={showTimePicker} style={styles.dateTimeButton}>
                <Text style={styles.dateTimeText}>Escolher Hora</Text>
              </TouchableOpacity>
            </View>

            <DateTimePickerModal
              isVisible={state.isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
              date={state.date}
              textColor="black"
            />

            <DateTimePickerModal
              isVisible={state.isTimePickerVisible}
              mode="time"
              onConfirm={handleConfirmTime}
              onCancel={hideTimePicker}
              date={state.date}
              textColor="black"
            />

            <Text style={styles.dateDisplay}>{formatDateDisplay(state.date)}</Text>

            <TextInput
              placeholder="Horas de aviso"
              value={state.warningHours.toString()}
              onChangeText={(text) => setState((prev) => ({ ...prev, warningHours: Number(text) }))}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Local"
              value={state.location}
              onChangeText={(text) => setState((prev) => ({ ...prev, location: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Doutor(a)"
              value={state.specialist}
              onChangeText={(text) => setState((prev) => ({ ...prev, specialist: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Especialidade"
              value={state.specialty}
              onChangeText={(text) => setState((prev) => ({ ...prev, specialty: text }))}
              style={styles.input}
            />
            <TouchableOpacity style={styles.buttonSalvar} onPress={handleSaveReminder}>
              <Text style={styles.buttonTextSalvar}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonClose} onPress={onClose}>
              <Text style={styles.buttonTextClose}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAwareScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalView: {
    margin: 26,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    width: "100%",
    marginBottom: 20,
  },
  dateTimeWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  dateTimeButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    width: "48%",
    alignItems: "center",
  },
  dateTimeText: {
    color: "white",
    fontSize: 16,
  },
  dateDisplay: {
    fontSize: 16,
    color: "#333",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  buttonSalvar: {
    backgroundColor: "#34A853",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: "100%",
    marginTop: 10,
    alignItems: "center",
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
    alignItems: "center",
  },
  buttonTextClose: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
});

export default RemindersConsultationScreen;
