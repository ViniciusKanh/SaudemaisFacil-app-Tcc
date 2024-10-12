import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db } from '../../../config/firebaseConfig';
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const ReminderEditModalConsulta = ({ isVisible, onClose, reminderToEdit }) => {
  const [typeConsultation, setTypeConsultation] = useState(reminderToEdit?.Type ?? "");
  const [warningHours, setWarningHours] = useState(reminderToEdit?.WarningHours?.toString() ?? "");
  const [date, setDate] = useState(new Date(reminderToEdit?.date_time ?? new Date()));
  const [specialist, setSpecialist] = useState(reminderToEdit?.specialist ?? "");
  const [specialty, setSpecialty] = useState(reminderToEdit?.specialty ?? "");
  const [typeOptions, setTypeOptions] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [location, setLocation] = useState(reminderToEdit?.location ?? "");

  useEffect(() => {
    if (isVisible) {
      const fetchTypeConsultation = async () => {
        const querySnapshot = await getDocs(collection(db, "TypeConsultation"));
        const fetchedTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTypeOptions(fetchedTypes);
      };
      fetchTypeConsultation();
    }
  }, [isVisible]);

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (selectedDate) => {
    setDate(selectedDate);
    hideDatePicker();
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleConfirmTime = (selectedTime) => {
    const currentDate = new Date(date);
    currentDate.setHours(selectedTime.getHours());
    currentDate.setMinutes(selectedTime.getMinutes());
    setDate(currentDate);
    hideTimePicker();
  };

  const handleUpdate = async () => {
    if (!typeConsultation || !warningHours || !date || !location || !specialist || !specialty) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    const updatedReminderData = {
      Type: typeConsultation,
      WarningHours: Number(warningHours) || 0,
      date_time: date.toISOString(),
      location: location,
      specialist: specialist,
      specialty: specialty,
      Status: 0
    };

    try {
      const docRef = doc(db, "remindersConsultation", reminderToEdit.id);
      await updateDoc(docRef, updatedReminderData);
      Alert.alert("Sucesso", "Lembrete atualizado com sucesso!");
      onClose();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar o lembrete: " + error.message);
    }
  };

  const formatDateDisplay = () => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <KeyboardAwareScrollView>
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <Text style={styles.modalTitle}>Editar Lembrete de Consulta</Text>
            <Picker
              selectedValue={typeConsultation}
              onValueChange={setTypeConsultation}
              style={styles.picker}
            >
              {typeOptions.map((option) => (
                <Picker.Item key={option.id} label={option.type} value={option.id} />
              ))}
            </Picker>
            <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
              <Text style={styles.dateText}>Escolher Data</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={showTimePicker} style={styles.dateButton}>
              <Text style={styles.dateText}>Escolher Hora</Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
              date={date}
              textColor="black" // Adicione essa linha para definir a cor do texto
            />

            <DateTimePickerModal
              isVisible={isTimePickerVisible}
              mode="time"
              onConfirm={handleConfirmTime}
              onCancel={hideTimePicker}
              date={date}
              textColor="black" // Adicione essa linha para definir a cor do texto
            />

            <Text style={styles.dateDisplay}>{formatDateDisplay()}</Text>

            <TextInput
              placeholder="Horas de avisos"
              value={warningHours}
              onChangeText={setWarningHours}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Local"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
            />
            <TextInput
              placeholder="Especialista"
              value={specialist}
              onChangeText={setSpecialist}
              style={styles.input}
            />
            <TextInput
              placeholder="Especialidade"
              value={specialty}
              onChangeText={setSpecialty}
              style={styles.input}
            />
            <TouchableOpacity style={styles.buttonSalvar} onPress={handleUpdate}>
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
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: "#333",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardDetail: {
    fontSize: 15,
    color: "#666",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconSpacing: {
    marginRight: 16,
  },
  scrollViewContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 30,
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
    marginBottom: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    width: "80%",
    marginBottom: 20,
  },
  input: {
    width: "80%",
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
  dateButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  dateText: {
    color: "#fff",
    fontSize: 16,
  },
  dateDisplay: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
  },
});

export default ReminderEditModalConsulta;
