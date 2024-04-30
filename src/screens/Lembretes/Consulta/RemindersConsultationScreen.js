// RemindersConsultationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Button,
  Keyboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'


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
  const [typeConsultation, setTypeConsultation] = useState(initialState.typeConsultation);
  const [warningHours, setWarningHours] = useState(initialState.warningHours);
  const [location, setLocation] = useState(initialState.location);
  const [specialist, setSpecialist] = useState(initialState.specialist);
  const [specialty, setSpecialty] = useState(initialState.specialty);
  const [date, setDate] = useState(initialState.date);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(initialState.isDatePickerVisible);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(initialState.isTimePickerVisible);
  const [typeOptions, setTypeOptions] = useState(initialState.typeOptions); // typeOptions inicializado corretamente.


  const auth = getAuth();
  const user = auth.currentUser;


  useEffect(() => {
    if (isVisible) {
      const fetchTypeConsultation = async () => {
        const querySnapshot = await getDocs(collection(db, "TypeConsultation"));
        const fetchedTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTypeOptions(fetchedTypes);
      };
      fetchTypeConsultation();
    }
  
    // Configuração dos listeners de teclado
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', _keyboardDidHide);
  
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [isVisible]);

  const [keyboardPadding, setKeyboardPadding] = useState(0);

// As funções _keyboardDidShow e _keyboardDidHide
const _keyboardDidShow = (e) => setKeyboardPadding(e.endCoordinates.height);
const _keyboardDidHide = () => setKeyboardPadding(0);


  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const showTimePicker = () => {
    // Only show time picker after a date has been set
    if (date) {
      setTimePickerVisibility(true);
    } else {
      alert("Por favor, escolha uma data primeiro.");
    }
  };

  const handleConfirmDate = (selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    setDatePickerVisibility(false);
  };

  const handleConfirmTime = (selectedTime) => {
    const currentTime = selectedTime || new Date(date);
    setDate(new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      currentTime.getHours(),
      currentTime.getMinutes()
    ));
    setTimePickerVisibility(false);
  };

  const handleSaveReminder = async () => {
    if (!user) {
      alert("Usuário não está logado.");
      return;
    }

    const formattedDateTime = date.toISOString();
    try {
      await addDoc(collection(db, "remindersConsultation"), {
        ID_user: user.uid,
        Type: typeConsultation.id, // Salva o ID do tipo de consulta
        TypeName: typeConsultation.name, // Salva o nome do tipo de consulta
        date_time: formattedDateTime,
        location,
        specialist,
        specialty,
        WarningHours: Number(warningHours),
        Status: 0  // Define o status inicial como pendente
      });
      alert("Lembrete salvo com sucesso!");
        // Agende a notificação
    scheduleNotification(date.toISOString(), warningHours);
    
     // Sucesso no salvamento do lembrete
      setTypeConsultation(initialState.typeConsultation);
      setWarningHours(initialState.warningHours);
      setLocation(initialState.location);
      setSpecialist(initialState.specialist);
      setSpecialty(initialState.specialty);
      setDate(initialState.date);
      setDatePickerVisibility(initialState.isDatePickerVisible);
      setTimePickerVisibility(initialState.isTimePickerVisible);
      
      onClose(); // Fechando o modal após o salvamento
    } catch (error) {
      console.error("Erro ao salvar lembrete: ", error);
      alert("Erro ao salvar lembrete.");
    }
  };

  // Função para formatar a data e hora selecionadas para visualização
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
<KeyboardAwareScrollView extraScrollHeight={20}>
        <View style={styles.modalView}>
        <ScrollView contentContainerStyle={{ paddingBottom: keyboardPadding }}>
            <Text style={styles.modalTitle}>Adicionar Novo Lembrete</Text>
            <Picker
  selectedValue={typeConsultation.id}
  onValueChange={(itemValue) => {
    const selectedType = typeOptions.find(option => option.id === itemValue);
    setTypeConsultation({ id: itemValue, name: selectedType ? selectedType.type : '' });
  }}
  style={styles.picker}
>
  {typeOptions.map((option) => (
    <Picker.Item key={option.id} label={option.type} value={option.id} />
  ))}
</Picker>
            <Button title="Escolher Data" onPress={showDatePicker} />
            <Button title="Escolher Hora" onPress={showTimePicker} />
            <Text style={styles.dateDisplay}>{formatDateDisplay()}</Text>
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={() => setDatePickerVisibility(false)}
              date={date}
            />
            <DateTimePickerModal
              isVisible={isTimePickerVisible}
              mode="time"
              onConfirm={handleConfirmTime}
              onCancel={() => setTimePickerVisibility(false)}
              date={date}
            />
            <TextInput
              placeholder="Horas de aviso"
              value={warningHours.toString()}
              onChangeText={(text) => setWarningHours(Number(text))}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput placeholder="Local" value={location} onChangeText={setLocation} style={styles.input} />
            <TextInput placeholder="Especialista" value={specialist} onChangeText={setSpecialist} style={styles.input} />
            <TextInput placeholder="Especialidade" value={specialty} onChangeText={setSpecialty} style={styles.input} />
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateDisplay: {
    fontSize: 16,
    color: '#333',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
  },
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
    marginBottom: -40,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    width: "100%",
    marginBottom: -20,
  },

  input: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
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
  dateTimeWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20, // Espaçamento vertical entre este elemento e os outros
    width: "100%", // Ocupa toda a largura disponível
  },
  dateTimeContainer: {
    alignItems: "center",
    flex: 1, // Faz com que cada container ocupe metade da largura disponível
  },
  dateButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10, // Espaçamento entre o botão e o texto
  },
  dateTimeText: {
    color: "#007bff",
    fontSize: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default RemindersConsultationScreen;
