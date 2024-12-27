import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Notifications from 'expo-notifications';
import { Picker } from '@react-native-picker/picker'; // Adicione o pacote correto

import {
  CapsuleIcon,
  PillIcon,
  PoteIcon,
  ComprimidoRetangularIcon,
  InjecaoIcon,
  AdesivoIcon,
  CremeIcon,
  SprayIcon,
} from "../../Medicamento/FormsMedications";

const RemindersMedicationScreen = ({ isVisible, onClose }) => {
  const [medications, setMedications] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [finalDate, setFinalDate] = useState(new Date());
  const [intervalHours, setIntervalHours] = useState(""); // Mantém como string para compatibilidade com o Picker
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [selectedInterval, setSelectedInterval] = useState("0.5"); // Valor inicial (30 minutos)
  const auth = getAuth();
  const user = auth.currentUser;

  // Gera as opções do Picker (0.5 representa 30 minutos, 1 é 1 hora, até 23)
  const intervalOptions = Array.from({ length: 23 }, (_, i) => (i + 1).toString());
  const pickerOptions = ["0.5", ...intervalOptions];


  useEffect(() => {
    if (isVisible) {
      loadMedications();
    }
  }, [isVisible]);

  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão para enviar notificações foi negada!');
        return;
      }
    };
    getPermission();
  }, []);

  const loadMedications = async () => {
    if (user) {
      const q = collection(db, "medications");
      const querySnapshot = await getDocs(q);
      const meds = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMedications(meds);
    }
  };

  const handleIntervalChange = (value) => {
    setIntervalHours(value); // Atualiza o estado para compatibilidade com a lógica
    setSelectedInterval(value); // Atualiza o estado selecionado
  };

  const handleConfirmDate = (date) => {
    setFinalDate(date);
    setIsDatePickerVisible(false);
  };

  const handleConfirmTime = (time) => {
    setStartTime(time);
    setIsTimePickerVisible(false);
  };

  const calculateReminders = () => {
    if (!selectedMedication) {
      alert("Selecione um medicamento.");
      return;
    }
    if (!intervalHours) {
      alert("Informe o intervalo em horas.");
      return;
    }

    const reminders = [];
    let currentDate = new Date(startTime);
    const endDate = new Date(finalDate);
    const intervalMs = parseInt(intervalHours) * 60 * 60 * 1000;

    // Verifica se a data final está no passado
    if (endDate < new Date().setHours(0, 0, 0, 0)) {
      alert("A data final não pode ser no passado.");
      return;
    }

    while (currentDate <= endDate) {
      reminders.push(new Date(currentDate));
      currentDate.setTime(currentDate.getTime() + intervalMs);
    }

    saveReminders(reminders);
  };

  const saveReminders = async (reminders) => {
    try {
      const now = new Date(); // Obtém o momento atual

      for (const reminder of reminders) {
        const reminderDate = new Date(reminder);

        // Permitir lembretes somente em datas futuras
        if (reminderDate.getTime() <= now.getTime()) {
          Alert.alert("Erro", "Não é possível agendar uma notificação para uma data ou hora no passado.");
          continue;  // Ignora lembretes no passado
        }

        // Salvando lembretes como "Pendente"
        await addDoc(collection(db, "remindersMedication"), {
          userId: user.uid,
          medicationId: selectedMedication.id,
          medicationName: selectedMedication.name,
          reminderTime: reminderDate.toISOString(),
          status: "Pendente", // Mantenha o status como string
        });

        const reminderTimeFormatted = reminderDate.toLocaleTimeString("pt-BR", {
          hour: '2-digit',
          minute: '2-digit',
        });

        // Agendar a notificação
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Hora do medicamento!",
            body: `Está na hora de tomar o medicamento: ${selectedMedication.name} às ${reminderTimeFormatted} no Saude+Facil`,
            data: { reminder },
          },
          trigger: {
            date: reminderDate,
          },
        });
      }

      Alert.alert("Sucesso", "Lembretes e notificações criados com sucesso!");

      // Limpar campos após salvar
      setSelectedMedication(null);
      setFinalDate(new Date());
      setStartTime(new Date());
      setIntervalHours("");

      onClose(); // Fecha o modal após salvar
    } catch (error) {
      console.error("Erro ao salvar lembretes: ", error);
      Alert.alert("Erro", "Erro ao salvar lembretes.");
    }
  };

  const renderMedicationCard = ({ item }) => {
    const MedicationIcon = {
      Pill: PillIcon,
      Capsule: CapsuleIcon,
      Potinho: PoteIcon,
      ComprimidoRetangular: ComprimidoRetangularIcon,
      Injecao: InjecaoIcon,
      Adesivo: AdesivoIcon,
      Cream: CremeIcon,
      Spray: SprayIcon,
    }[item.form];

    return (
      <TouchableOpacity
        style={[
          styles.medicationCard,
          selectedMedication?.id === item.id && styles.selectedCard,
        ]}
        onPress={() => setSelectedMedication(item)}
      >
        <View
          style={[
            styles.medicationImageContainer,
            { backgroundColor: item.backgroundColor || "#fff" },
          ]}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.medicationImage} />
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{item.name}</Text>
          <Text style={styles.medicationDetails}>Dosagem: {item.dosage}</Text>
          <Text style={styles.medicationDetails}>Concentração: {item.concentration}</Text>
          {MedicationIcon && (
            <MedicationIcon color={item.color} size={30} style={styles.medicationIcon} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Adicionar Lembrete de Medicamento</Text>
          <FlatList
            data={medications}
            renderItem={renderMedicationCard}
            keyExtractor={(item) => item.id}
            style={styles.medicationList}
          />
          <View style={styles.labelContainer}>
          
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setIsDatePickerVisible(true)}
            >
              <Text style={styles.dateButtonText}>Escolher Data Final</Text>
            </TouchableOpacity>
            {finalDate && (
              <Text style={styles.selectedDateText}>
                <Text style={styles.label}>Data Final:  {finalDate.toLocaleDateString("pt-BR")}</Text>
              </Text>
            )}
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={() => setIsDatePickerVisible(false)}
            date={finalDate}
            display="spinner"
            textColor="black"
          />

          <View style={styles.labelContainer}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setIsTimePickerVisible(true)}
            >
              <Text style={styles.timeButtonText}>Escolher Hora Inicial</Text>
            </TouchableOpacity>
            {startTime && (
               <Text style={styles.label}>Hora Inicial: {startTime.toLocaleTimeString("pt-BR", {
                hour: '2-digit',
                minute: '2-digit',
              })}</Text>
            
            )}
          </View>

          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            onConfirm={handleConfirmTime}
            onCancel={() => setIsTimePickerVisible(false)}
            date={startTime}
            display="spinner"
            textColor="black"
          />

        {/* Campo Intervalo como Picker */}
        <View style={styles.labelContainer}>
            <Text style={styles.label}>Intervalo em horas:</Text>
            <Picker
              selectedValue={selectedInterval}
              onValueChange={handleIntervalChange}
              style={styles.picker}
            >
              <Picker.Item label="30 minutos" value="0.5" />
              {pickerOptions.map((option) => (
                <Picker.Item key={option} label={`${option} hora(s)`} value={option} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={calculateReminders}>
            <Text style={styles.saveButtonText}>Salvar Lembrete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 50,
  },
  modalView: {
    margin: 20,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  medicationList: {
    width: "100%",
    maxHeight: 300,
  },
  medicationCard: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  medicationImageContainer: {
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginRight: 15,
  },
  medicationImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  medicationInfo: {
    flex: 1,
    justifyContent: "center",
  },
  medicationName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  medicationDetails: {
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    width: "100%",
  },
  dateButtonText: {
    color: "white",
    fontSize: 16,
  },
  timeButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    width: "100%",
  },
  timeButtonText: {
    color: "white",
    fontSize: 16,
  },
  labelContainer: {
    width: "100%",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  selectedCard: {
    backgroundColor: "#cce5ff",
  },
  selectedDateText: {
    color: "#333",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "bold",
  },
  selectedTimeText: {
    color: "#333",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "bold",
  },

});

export default RemindersMedicationScreen;
