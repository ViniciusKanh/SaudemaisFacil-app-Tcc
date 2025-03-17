//RelRemindersMedicationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
} from "react-native";
import { db } from "../../../config/firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import moment from "moment";
import 'moment/locale/pt-br';
import Icon from "react-native-vector-icons/FontAwesome5";
import {
  CapsuleIcon,
  PillIcon,
  PoteIcon,
  ComprimidoRetangularIcon,
  InjecaoIcon,
  AdesivoIcon,
  CremeIcon,
  SprayIcon,
} from "../../Medicamento/FormsMedications"; // Importando os ícones
import { useRoute } from "@react-navigation/native";
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from "react-native-modal-datetime-picker";


const RemindersMedicationViewScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true); // Loader enquanto carrega
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState([]);
  const loaderSize = "large"; // Certifique-se de que o valor é válido
  const route = useRoute();
  const TOLERANCE_MINUTES = route.params?.tolerance || 30; // Recebe a tolerância ou usa 30 como padrão
  const navigation = useNavigation(); // Obtém o objeto de navegação
  const [showAllPendings, setShowAllPendings] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const user = getAuth().currentUser;
  useEffect(() => {
    moment.locale('pt-br');
    generateWeekDates(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchReminders();
    //console.log("📌 Data selecionada:", moment(selectedDate).format("YYYY-MM-DD"));
   // console.log("✅ Lembretes a serem exibidos:", reminders);
  }, [selectedDate]);
  

  const generateWeekDates = (date) => {
    const startOfWeek = moment(date).startOf("week").toDate();
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      moment(startOfWeek).add(i, "days").toDate()
    );
    setCurrentWeek(weekDates);
  };

  const fetchReminders = async () => {
    setLoading(true);
  
    if (!user) {
      console.log("Nenhum usuário autenticado.");
      setLoading(false);
      return;
    }
  
    try {
      let remindersQuery = query(
        collection(db, "remindersMedication"),
        where("userId", "==", user.uid),
        orderBy("reminderTime", "asc")
      );
  
      const querySnapshot = await getDocs(remindersQuery);
      const allReminders = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
        formattedDate: moment(docSnapshot.data().reminderTime).format("YYYY-MM-DD"),
        formattedTime: moment(docSnapshot.data().reminderTime).format("HH:mm"),
      }));
  
     // console.log("📌 Todos os lembretes carregados:", allReminders);
  
      // Buscar os dados do medicamento associado a cada lembrete
      const medicationIds = [...new Set(allReminders.map(r => r.medicationId))];
      const medicationDocs = await Promise.all(medicationIds.map(id => getDoc(doc(db, "medications", id))));
  
      const medicationsMap = {};
      medicationDocs.forEach(doc => {
        if (doc.exists()) medicationsMap[doc.id] = doc.data();
      });
  
      // Associar os medicamentos aos lembretes
      const remindersWithMedications = allReminders.map(reminder => ({
        ...reminder,
        medicationData: medicationsMap[reminder.medicationId] || {},
      }));
  
   //   console.log("📌 Lembretes com informações do medicamento:", remindersWithMedications);
  
      // Filtrar apenas os lembretes para a data selecionada
      const selectedDateString = moment(selectedDate).format("YYYY-MM-DD");
    //  console.log("📅 Data selecionada no FlatList:", selectedDateString);
  
      const filteredReminders = remindersWithMedications.filter(reminder => {
     //   console.log(`🔍 Comparando: ${reminder.formattedDate} === ${selectedDateString}`);
        return reminder.formattedDate === selectedDateString;
      });
  
   //   console.log("✅ Lembretes filtrados para a data selecionada:", filteredReminders);
  
      // Categorizar os lembretes corretamente
      const groupedReminders = {
        "Pendentes": filteredReminders.filter(r => r.status === "Pendente"),
        "Não Tomados": filteredReminders.filter(r => r.status === "Não Tomado"),
        "Tomados": filteredReminders.filter(r => r.status === "Tomado"),
      };
  
   //   console.log("📌 Lembretes organizados por status:", groupedReminders);
  
      setReminders(groupedReminders);
    } catch (error) {
      console.error("❌ Erro ao buscar lembretes:", error);
      setReminders({ "Pendentes": [], "Não Tomados": [], "Tomados": [] });
    }
  
    setLoading(false);
  };
  
  
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders().finally(() => setRefreshing(false));
  };

  const handleMarkAsTaken = (reminder) => {
    setSelectedReminder(reminder);
    setIsTimePickerVisible(true);
  };
  
  const handleConfirmTime = async (time) => {
    if (!selectedReminder) return;
  
    const selectedDateTime = moment(time).toISOString(); // Salvar data e hora exata da ingestão
  
    try {
      await updateDoc(doc(db, "remindersMedication", selectedReminder.id), {
        status: "Tomado",
        horarioTomado: selectedDateTime, // Atualiza a data e hora real no banco
      });
  
      fetchReminders(); // Atualiza os lembretes após a alteração
    } catch (error) {
      console.error("Erro ao atualizar status do lembrete:", error);
    }
  
    setIsTimePickerVisible(false);
    setSelectedReminder(null);
  };
  


  const toggleShowAllPendings = () => {
    setShowAllPendings((prev) => !prev);
  };

  useEffect(() => {
    navigation.setOptions({ title: `Tolerância: ${TOLERANCE_MINUTES} minutos` });
  }, [navigation, TOLERANCE_MINUTES]);

  const handleDelete = async (id) => {
    try {
      if (id) {
        await deleteDoc(doc(db, "remindersMedication", id));
        fetchReminders(); // Atualiza automaticamente após a exclusão
      } else {
        console.error("ID inválido para exclusão:", id);
      }
    } catch (error) {
      console.error("Erro ao deletar lembrete: ", error);
    }
  };

  const handlePreviousWeek = () => {
    const newDate = moment(selectedDate).subtract(1, "week").toDate();
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = moment(selectedDate).add(1, "week").toDate();
    setSelectedDate(newDate);
  };

  const renderDateItem = ({ item }) => {
    const isSelected = moment(item).isSame(selectedDate, "day");
 //   console.log("📅 Renderizando Data na FlatList:", moment(item).format("YYYY-MM-DD"), "Selecionado:", isSelected);
  
    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => {
    //      console.log("🔄 Mudando data selecionada para:", moment(item).format("YYYY-MM-DD"));
          setSelectedDate(item);
        }}
      >
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
          {moment(item).format("D")}
        </Text>
        <Text style={[styles.dayText, isSelected && styles.dateTextSelected]}>
          {moment(item).format("ddd").toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };
  
  
  const renderReminder = (item) => {
    const isTaken = item.status === "Tomado";
    const isLate = item.status === "Não Tomado";

    const medicationData = item.medicationData || {};

    const MedicationIcon = medicationData.form
        ? {
              Pill: PillIcon,
              Capsule: CapsuleIcon,
              Potinho: PoteIcon,
              ComprimidoRetangular: ComprimidoRetangularIcon,
              Injecao: InjecaoIcon,
              Adesivo: AdesivoIcon,
              Cream: CremeIcon,
              Spray: SprayIcon,
          }[medicationData.form]
        : null;

    // Converter horários para comparação
    const scheduledTime = moment(`${item.formattedDate} ${item.formattedTime}`, "YYYY-MM-DD HH:mm");
    const takenTime = item.horarioTomado ? moment(item.horarioTomado) : null;

    let timeDifferenceText = "⏳ Não foi tomado";
    let differenceMinutes = 0;

    if (isTaken && takenTime) {
        differenceMinutes = takenTime.diff(scheduledTime, "minutes");

        if (differenceMinutes > 0) {
            timeDifferenceText = `⏳ Atrasado ${differenceMinutes} min`;
        } else if (differenceMinutes < 0) {
            timeDifferenceText = `⏩ Adiantado ${Math.abs(differenceMinutes)} min`;
        } else {
            timeDifferenceText = "✅ Tomado no horário";
        }
    }

    return (
        <View key={item.id} style={[styles.card, isTaken && styles.cardTaken, isLate && styles.cardLate]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardDetails}>
                    {medicationData.imageUrl ? (
                        <Image source={{ uri: medicationData.imageUrl }} style={styles.medicationImage} />
                    ) : (
                        <View style={styles.placeholderImage} />
                    )}

                    <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>{medicationData.name || "Nome não disponível"}</Text>
                        <Text style={styles.medicationDetails}>Dosagem: {medicationData.dosage || "N/A"}</Text>
                        <Text style={styles.medicationDetails}>Tipo: {medicationData.type || "N/A"}</Text>
                        <Text style={styles.medicationDetails}>Forma: {medicationData.form || "N/A"}</Text>
                        <Text style={styles.medicationDetails}>Observações: {medicationData.observations || "Nenhuma"}</Text>
                    </View>

                    {MedicationIcon && <MedicationIcon color={medicationData.color || "#000"} size={50} style={styles.medicationIcon} />}
                </View>

                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.trashIcon}>
                    <Icon name="trash" size={24} color="red" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.reminderTime}>Programado: {item.formattedDate} às {item.formattedTime}</Text>

                {isTaken ? (
                    <View>
                        <Text style={styles.takenTime}>Tomado às {takenTime.format("DD/MM/YYYY HH:mm")}</Text>
                        <Text style={[styles.timeDifference, differenceMinutes > 0 ? styles.lateText : styles.earlyText]}>
                            {timeDifferenceText}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => handleMarkAsTaken(item)} style={styles.takenButton}>
                        <Text style={styles.buttonText}>Medicamento Tomado</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};


  return (
    <View style={styles.container}>
      <View style={styles.monthYearHeader}>
        <Text style={styles.monthText}>{moment(selectedDate).format("MMMM YYYY")}</Text>
      </View>
      <Text style={styles.toleranceText}>
        Tolerância: {TOLERANCE_MINUTES} minutos
      </Text>
      <View style={styles.weekSelector}>
  <TouchableOpacity onPress={handlePreviousWeek} style={styles.arrowButton}>
    <Icon name="chevron-left" size={24} color="#28a745" />
  </TouchableOpacity>

  <FlatList
    data={currentWeek}
    renderItem={renderDateItem}
    keyExtractor={(item) => item.toString()}
    horizontal // Torna a lista horizontal
    showsHorizontalScrollIndicator={false} // Oculta a barra de rolagem
    contentContainerStyle={styles.weekListContainer} // Adiciona um estilo para o container
  />

<DateTimePickerModal
  isVisible={isTimePickerVisible}
  mode="time"
  onConfirm={handleConfirmTime} // Função que salva o horário escolhido
  onCancel={() => setIsTimePickerVisible(false)}
  display="spinner"
/>


  <TouchableOpacity onPress={handleNextWeek} style={styles.arrowButton}>
    <Icon name="chevron-right" size={24} color="#28a745" />
  </TouchableOpacity>
</View>


      {loading ? (
        <ActivityIndicator size={loaderSize} color="#28a745" style={styles.loader} />
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {Object.keys(reminders).map((status) => (
          reminders[status].length > 0 ? (
            <View key={status} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{status}</Text>
              {reminders[status].map((item) => renderReminder(item))}
            </View>
          ) : null
        ))}
      </ScrollView>
      
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loader: {
    marginTop: 20,
  },
  monthYearHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateList: {
    flexGrow: 1,
    justifyContent: "space-around",
  },
  arrowButton: {
    padding: 10,
  },
  dateItem: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 5,
    alignItems: "center",
  },
  dateItemSelected: {
    backgroundColor: "#28a745",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  dateTextSelected: {
    color: "#fff",
  },
  dayText: {
    fontSize: 14,
    color: "#666",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noRemindersText: {
    fontSize: 14,
    color: "#666",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTaken: {
    opacity: 0.6,
    borderColor: "blue",
    borderWidth: 7,
  },
  cardLate: {
    opacity: 0.4,
    borderColor: "red",
    borderWidth: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardDetails: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  medicationImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
  },
  medicationInfo: {
    flexDirection: "column",
    flex: 1,
  },
  medicationIcon: {
    marginLeft: 10,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  medicationDetails: {
    fontSize: 14,
    color: "#666",
  },
  trashIcon: {
    marginLeft: 15,
  },
  cardFooter: {
    alignItems: "center",
  },
  reminderTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  takenButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  toleranceText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekSelector: {
    flexDirection: 'row', // Alinha os itens na horizontal
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  
  weekListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  
  dateItem: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50, // Define largura mínima para os itens
  },
  
  dateItemSelected: {
    backgroundColor: '#28a745',
  },
  
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  
  dateTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
});

export default RemindersMedicationViewScreen;
