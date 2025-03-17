//RelRemindersConsultationScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SectionList,
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
} from "firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";
import moment from "moment";
import { getAuth } from "firebase/auth";
import ReminderEditModalConsulta from './ReminderEditModalConsulta';

const RelRemindersConsultationScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentReminderToEdit, setCurrentReminderToEdit] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [pendingReminders, setPendingReminders] = useState([]);
const [completedReminders, setCompletedReminders] = useState([]);
const [cancelledReminders, setCancelledReminders] = useState([]);
const [selectedDate, setSelectedDate] = useState(moment().startOf('day'));
const [dateList, setDateList] = useState([]);
const [allReminders, setAllReminders] = useState([]); // Guarda todos os lembretes carregados
const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf('week'));


// Atualiza a lista de datas sempre que a semana atual muda
useEffect(() => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(moment(currentWeekStart).add(i, 'days'));
  }
  setDateList(dates);
}, [currentWeekStart]);

useEffect(() => {
  const unsubscribe = getAuth().onAuthStateChanged(user => {
    if (user) fetchReminders();
  });
  return () => unsubscribe();
}, []);

 // Sempre que a data selecionada mudar, refiltre os lembretes
 useEffect(() => {
  filterRemindersByDate();
}, [selectedDate, allReminders]);

const fetchReminders = async () => {
  const user = getAuth().currentUser;
  if (!user) {
    console.log("Nenhum usuário autenticado.");
    return;
  }

  const remindersQuery = query(
    collection(db, "remindersConsultation"),
    where("ID_user", "==", user.uid),
    orderBy("date_time", "asc")
  );
  
  const querySnapshot = await getDocs(remindersQuery);
  const fetchedReminders = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    formattedDate: moment(doc.data().date_time).format("DD/MM/YYYY"),
    formattedTime: moment(doc.data().date_time).format("HH:mm"),
    // Converte Status para número (caso esteja armazenado como string)
    Status: Number(doc.data().Status)
  }));

  setAllReminders(fetchedReminders);
  // Após carregar, filtre pelo dia selecionado
  filterRemindersByDate(fetchedReminders);
};

const filterRemindersByDate = (remindersArray = allReminders) => {
  // Filtra os lembretes cujo "date_time" seja igual ao dia selecionado
  const filtered = remindersArray.filter(reminder =>
    moment(reminder.date_time).isSame(selectedDate, 'day')
  );

  const sections = [
    { title: 'Pendentes', data: filtered.filter(reminder => reminder.Status === 0) },
    { title: 'Concluídas', data: filtered.filter(reminder => reminder.Status === 1) },
    { title: 'Canceladas', data: filtered.filter(reminder => reminder.Status === 2) }
  ];

  setReminders(sections);
};

const onRefresh = () => {
  setRefreshing(true);
  fetchReminders().finally(() => setRefreshing(false));
};

const statusStyles = {
  0: { color: 'gray', label: 'Pendente' },
  1: { color: 'green', label: 'Concluída' },
  2: { color: 'red', label: 'Cancelada' },
};

const handleUpdateStatus = async (id, newStatus) => {
  try {
    // Atualiza localmente para feedback imediato
    const updatedReminders = allReminders.map(reminder => {
      if (reminder.id === id) {
        return { ...reminder, Status: newStatus };
      }
      return reminder;
    });
    setAllReminders(updatedReminders);
    await updateDoc(doc(db, "remindersConsultation", id), { Status: newStatus });
    onRefresh();
  } catch (error) {
    console.error("Error updating reminder status:", error);
    fetchReminders();
  }
};

const renderSectionHeader = ({ section: { title } }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);


const openEditModal = (reminder) => {
  setCurrentReminderToEdit(reminder);
  setIsEditModalVisible(true);
  onRefresh();
};

const handleDelete = async (id) => {
  try {
    await deleteDoc(doc(db, "remindersConsultation", id));
    setAllReminders(allReminders.filter(reminder => reminder.id !== id));
    onRefresh(); 
  } catch (error) {
    console.error("Error deleting reminder:", error);
  }
};

const renderItem = ({ item }) => {
  const cardStatusStyle =
    item.Status === 2
      ? styles.cardCancelled
      : item.Status === 1
      ? styles.cardCompleted
      : {};

  return (
    <View style={[styles.card, cardStatusStyle]}>
      <View style={styles.cardInfo}>
        <View style={styles.cardDetailsAndIcons}>
          <View style={styles.cardTextDetails}>
            <Text style={styles.cardTitle}>
              Dr(a). {item.specialist} - {item.specialty}
            </Text>
            <Text style={styles.cardDetail}>Data: {item.formattedDate}</Text>
            <Text style={styles.cardDetail}>Hora: {item.formattedTime}</Text>
            <Text style={styles.cardDetail}>Local: {item.location}</Text>
            <Text style={styles.cardDetail}>
              Aviso: {item.WarningHours} horas antes
            </Text>
            <Text style={styles.typeConsultation}>{item.TypeName}</Text>
            <Text
              style={[
                styles.statusLabel,
                { color: statusStyles[item.Status]?.color, fontWeight: 'bold', fontSize: 16 },
              ]}
            >
              {statusStyles[item.Status]?.label}
            </Text>
          </View>
          <View style={styles.icons}>
            <TouchableOpacity onPress={() => openEditModal(item)}>
              <Icon name="edit" size={22} color="blue" style={styles.iconSpacing} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Icon name="trash" size={24} color="red" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => handleUpdateStatus(item.id, 2)} style={styles.cancelButton}>
            <Text style={styles.buttonText}>Consulta Cancelada</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleUpdateStatus(item.id, 1)} style={styles.completeButton}>
            <Text style={styles.buttonText}>Consulta Realizada</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Sobreposição para status */}
      {item.Status === 2 && (
        <View style={styles.cancelledOverlay}>
          <Icon name="times" size={30} color="red" />
        </View>
      )}
      {item.Status === 1 && (
        <View style={styles.completedOverlay}>
          <View style={styles.diagonalLine} />
        </View>
      )}
    </View>
  );
};

return (
  <View style={styles.container}>
    {/* Navegação entre semanas */}
    <View style={styles.weekNavigationContainer}>
      <TouchableOpacity
        onPress={() => setCurrentWeekStart(moment(currentWeekStart).subtract(7, 'days'))}
        style={styles.arrowButton}
      >
        <Text style={styles.arrowText}>{"<"}</Text>
      </TouchableOpacity>
      <FlatList
        data={dateList}
        horizontal
        keyExtractor={(item) => item.format('YYYY-MM-DD')}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedDate(item)}>
            <View
              style={[
                styles.dateItemContainer,
                selectedDate.isSame(item, 'day') && styles.dateItemContainerSelected,
              ]}
            >
              <Text
                style={[
                  styles.dateItemText,
                  selectedDate.isSame(item, 'day') && styles.dateItemTextSelected,
                ]}
              >
                {item.format("DD/MM")}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.dateListContainer}
      />
      <TouchableOpacity
        onPress={() => setCurrentWeekStart(moment(currentWeekStart).add(7, 'days'))}
        style={styles.arrowButton}
      >
        <Text style={styles.arrowText}>{">"}</Text>
      </TouchableOpacity>
    </View>
    {/* Lista de lembretes filtrados por data */}
    <SectionList
      sections={reminders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        const cardStyle =
          item.Status === 2
            ? styles.cardCancelled
            : item.Status === 1
            ? styles.cardCompleted
            : styles.card;
        return (
          <View style={cardStyle}>
            <View style={styles.cardInfo}>
              <View style={styles.cardDetailsAndIcons}>
                <View style={styles.cardTextDetails}>
                  <Text style={styles.cardTitle}>
                    Dr(a). {item.specialist} - {item.specialty}
                  </Text>
                  <Text style={styles.cardDetail}>Data: {item.formattedDate}</Text>
                  <Text style={styles.cardDetail}>Hora: {item.formattedTime}</Text>
                  <Text style={styles.cardDetail}>Local: {item.location}</Text>
                  <Text style={styles.cardDetail}>
                    Aviso: {item.WarningHours} horas antes
                  </Text>
                  <Text style={styles.typeConsultation}>{item.TypeName}</Text>
                  <Text
                    style={[
                      styles.statusLabel,
                      { color: statusStyles[item.Status]?.color, fontWeight: 'bold', fontSize: 16 },
                    ]}
                  >
                    {statusStyles[item.Status]?.label}
                  </Text>
                </View>
                <View style={styles.icons}>
                  <TouchableOpacity onPress={() => openEditModal(item)}>
                    <Icon name="edit" size={22} color="blue" style={styles.iconSpacing} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Icon name="trash" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
              {item.Status === 0 && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(item.id, 2)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.buttonText}>Consulta Cancelada</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(item.id, 1)}
                    style={styles.completeButton}
                  >
                    <Text style={styles.buttonText}>Consulta Realizada</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );
      }}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionTitle}>{title}</Text>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
    {isEditModalVisible && (
      <ReminderEditModalConsulta
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        reminderToEdit={currentReminderToEdit}
        onSave={handleUpdateStatus}
      />
    )}
  </View>
);


};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#F5F5F5",
  },
  // Navegação entre semanas
  weekNavigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  arrowButton: {
    backgroundColor: '#65BF85',
    padding: 10,
    borderRadius: 25,
    marginHorizontal: 10,
    elevation: 3,
  },
  arrowText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Estilos para o seletor de datas (FlatList)
  dateListContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateItemContainer: {
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    elevation: 2,
  },
  dateItemContainerSelected: {
    backgroundColor: "#65BF85",
    borderColor: "#65BF85",
    transform: [{ scale: 1.1 }],
  },
  dateItemText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  dateItemTextSelected: {
    color: "#FFF",
    fontWeight: "bold",
  },
  // Estilos para os cards de lembretes
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardInactive: {
    opacity: 0.4,
  },
  cardCancelled: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "red",
    opacity: 0.4,
  },
  cardCompleted: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "blue",
    opacity: 0.4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  cardInfo: {
    flex: 1,
  },
  cardDetailsAndIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 15,
    color: "#666",
  },
  typeConsultation: {
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    marginTop: 5,
  },
  statusLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconSpacing: {
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  completeButton: {
    backgroundColor: 'green',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    margin: 5,
  },
  cancelButton: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  cardDisabled: {
    opacity: 0.4,
  },
});

export default RelRemindersConsultationScreen;
