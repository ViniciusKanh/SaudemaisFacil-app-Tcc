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

  useEffect(() => {
    moment.locale('pt-br'); // Configura o moment.js para PT-BR
    generateWeekDates(selectedDate);
    fetchReminders();
  }, [selectedDate]);

  const generateWeekDates = (selectedDate) => {
    const startOfWeek = moment(selectedDate).startOf("week").toDate();
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      weekDates.push(moment(startOfWeek).add(i, "days").toDate());
    }
    setCurrentWeek(weekDates);
  };

  const fetchReminders = async () => {
    setLoading(true); // Exibe o loader
    const user = getAuth().currentUser;
    if (!user) {
      console.log("Nenhum usuário autenticado.");
      setLoading(false); // Remove o loader
      return;
    }

    const remindersQuery = query(
      collection(db, "remindersMedication"),
      where("userId", "==", user.uid),
      orderBy("reminderTime", "asc")
    );

    const querySnapshot = await getDocs(remindersQuery);
    const allReminders = [];

    for (const docSnapshot of querySnapshot.docs) {
      const reminderData = docSnapshot.data();
      const reminderTime = moment(reminderData.reminderTime);
      const timeDifference = moment().diff(reminderTime, 'minutes');
      const isLate = timeDifference > TOLERANCE_MINUTES; // Usa a tolerância passada

      const status = isLate
        ? "Não Tomado"
        : reminderData.status === "Tomado"
        ? "Tomado"
        : "Pendente";

      const medicationDocRef = doc(db, "medications", reminderData.medicationId);
      const medicationDoc = await getDoc(medicationDocRef);
      const medicationData = medicationDoc.exists() ? medicationDoc.data() : {};

      allReminders.push({
        id: docSnapshot.id,
        ...reminderData,
        medicationData, // Adiciona os dados do medicamento relacionados
        formattedDate: reminderTime.format("DD/MM/YYYY"),
        formattedTime: reminderTime.format("HH:mm"),
        Status: status,
      });
    }

    const filteredReminders = allReminders.filter(
      (reminder) => moment(reminder.reminderTime).isSame(selectedDate, "day")
    );

    // Separar lembretes por status: Pendentes, Não Tomados e Tomados
    const pendingReminders = filteredReminders.filter(reminder => reminder.Status === "Pendente");
    const notTakenReminders = filteredReminders.filter(reminder => reminder.Status === "Não Tomado");
    const completedReminders = filteredReminders.filter(reminder => reminder.Status === "Tomado");

    setReminders([
      { title: "Pendentes", data: pendingReminders },
      { title: "Não Tomados", data: notTakenReminders },
      { title: "Tomados", data: completedReminders },
    ]);

    setLoading(false); // Remove o loader após carregar
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders().finally(() => setRefreshing(false));
  };

  const handleMarkAsTaken = async (reminder) => {
    try {
      await updateDoc(doc(db, "remindersMedication", reminder.id), { status: "Tomado" });
      fetchReminders(); // Atualiza automaticamente após a ação
    } catch (error) {
      console.error("Erro ao atualizar status do lembrete: ", error);
    }
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
    return (
      <TouchableOpacity
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
        onPress={() => setSelectedDate(item)}
      >
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{moment(item).format("D")}</Text>
        <Text style={[styles.dayText, isSelected && styles.dateTextSelected]}>{moment(item).format("ddd").toUpperCase()}</Text>
      </TouchableOpacity>
    );
  };

  const renderReminder = (item) => {
    const isTaken = item.Status === "Tomado";
    const isLate = item.Status === "Não Tomado";

    const MedicationIcon = item.medicationData?.form
      ? {
          Pill: PillIcon,
          Capsule: CapsuleIcon,
          Potinho: PoteIcon,
          ComprimidoRetangular: ComprimidoRetangularIcon,
          Injecao: InjecaoIcon,
          Adesivo: AdesivoIcon,
          Cream: CremeIcon,
          Spray: SprayIcon,
        }[item.medicationData.form]
      : null;

    return (
      <View key={item.id} style={[styles.card, isTaken && styles.cardTaken, isLate && styles.cardLate]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardDetails}>
            {item.medicationData?.imageUrl ? (
              <Image
                source={{ uri: item.medicationData.imageUrl }}
                style={styles.medicationImage}
              />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>
                {item.medicationData?.name || "Nome não disponível"}
              </Text>
              <Text style={styles.medicationDetails}>
                Dosagem: {item.medicationData?.dosage || "N/A"}
              </Text>
              <Text style={styles.medicationDetails}>
                Tipo: {item.medicationData?.type || "N/A"}
              </Text>
            </View>
            {MedicationIcon && (
              <MedicationIcon
                color={item.medicationData?.color || "#000"}
                size={50}
                style={styles.medicationIcon}
              />
            )}
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.trashIcon}>
            <Icon name="trash" size={24} color="red" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.reminderTime}>
            {item.formattedDate} às {item.formattedTime}
          </Text>
          {!isTaken && (
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

  <TouchableOpacity onPress={handleNextWeek} style={styles.arrowButton}>
    <Icon name="chevron-right" size={24} color="#28a745" />
  </TouchableOpacity>
</View>


      {loading ? (
        <ActivityIndicator size={loaderSize} color="#28a745" style={styles.loader} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {reminders.map((section, index) => (
            <View key={index} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.data.length > 0 ? (
                section.data.map((item) => renderReminder(item))
              ) : (
                <Text style={styles.noRemindersText}>Nenhum lembrete encontrado.</Text>
              )}
            </View>
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
