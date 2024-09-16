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
} from "react-native";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Notifications from 'expo-notifications';

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
  const [intervalHours, setIntervalHours] = useState("");
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [startTime, setStartTime] = useState(new Date());

  const auth = getAuth();
  const user = auth.currentUser;

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
  
        // Verifica se a data do lembrete é no futuro, considerando milissegundos
        if (reminderDate.getTime() <= now.getTime()) {
          alert("Não é possível agendar uma notificação para uma data ou hora no passado.");
          continue; // Ignora lembretes no passado e continua com os futuros
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
  
      alert("Lembretes e notificações criados com sucesso!");
  
      // Limpar campos após salvar
      setSelectedMedication(null);
      setFinalDate(new Date());
      setStartTime(new Date());
      setIntervalHours("");
  
      onClose(); // Fecha o modal após salvar
    } catch (error) {
      console.error("Erro ao salvar lembretes: ", error);
      alert("Erro ao salvar lembretes.");
    }
  };
  

  // Função de exclusão de lembretes
  const deleteReminder = async (id) => {
    try {
      await deleteDoc(doc(db, "remindersMedication", id));
      alert("Lembrete excluído com sucesso!");
      loadMedications(); // Recarrega os lembretes após exclusão
    } catch (error) {
      console.error("Erro ao excluir o lembrete: ", error);
      alert("Erro ao excluir o lembrete.");
    }
  };

  const IconComponents = {
    Pill: PillIcon,
    Capsule: CapsuleIcon,
    Potinho: PoteIcon,
    ComprimidoRetangular: ComprimidoRetangularIcon,
    Injecao: InjecaoIcon,
    Adesivo: AdesivoIcon,
    Cream: CremeIcon,
    Spray: SprayIcon,
  };

  const renderMedicationCard = ({ item }) => {
    const MedicationIcon = IconComponents[item.form];

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
          <Text style={styles.medicationDetails}>
            Dosagem: {item.dosage}
          </Text>
          <Text style={styles.medicationDetails}>
            Concentração: {item.concentration}
          </Text>
          <View style={styles.medicationFooter}>
            {MedicationIcon && (
              <MedicationIcon color={item.color} size={30} style={styles.medicationIcon} />
            )}
          </View>
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
          <Text style={styles.label}>Data Final:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setIsDatePickerVisible(true)}
          >
            <Text style={styles.dateButtonText}>Escolher Data Final</Text>
          </TouchableOpacity>
        </View>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setIsDatePickerVisible(false)}
          date={finalDate}
          display="spinner"
          textColor="black" // Força a cor do texto
        />
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Hora Inicial:</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setIsTimePickerVisible(true)}
          >
            <Text style={styles.timeButtonText}>Escolher Hora Inicial</Text>
          </TouchableOpacity>
        </View>
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={() => setIsTimePickerVisible(false)}
          date={startTime}
          display="spinner"
          textColor="black" // Força a cor do texto
        />
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Intervalo em horas:</Text>
          <TextInput
            style={styles.input}
            placeholder="Intervalo em horas"
            keyboardType="numeric"
            value={intervalHours}
            onChangeText={setIntervalHours}
          />
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
    maxHeight: 300, // Limita a altura da lista
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
  medicationFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 5,
  },
  medicationIcon: {
    marginLeft: 10,
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
  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default RemindersMedicationScreen;
