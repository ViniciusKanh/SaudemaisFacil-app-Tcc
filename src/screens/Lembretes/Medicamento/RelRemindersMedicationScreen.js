import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Image,
  RefreshControl,
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

const RemindersMedicationViewScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      if (user) fetchReminders();
    });
    return () => unsubscribe();
  }, []);

  const fetchReminders = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      console.log("Nenhum usuário autenticado.");
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
      const status = reminderTime.isBefore(moment().subtract(1, "hours"))
        ? "Tomado em Atraso"
        : reminderData.status;

      const medicationDocRef = doc(db, "medications", reminderData.medicationId);
      const medicationDoc = await getDoc(medicationDocRef);
      const medicationData = medicationDoc.exists() ? medicationDoc.data() : {};

      allReminders.push({
        id: docSnapshot.id,
        ...reminderData,
        medicationData,
        formattedDate: reminderTime.format("DD/MM/YYYY"),
        formattedTime: reminderTime.format("HH:mm"),
        Status: status,
      });
    }

    // Agrupando lembretes
    const sections = allReminders.reduce((acc, reminder) => {
      const medicationSection = acc.find(
        (section) => section.title === reminder.medicationData.name
      );
      if (medicationSection) {
        medicationSection.data.push(reminder);
      } else {
        acc.push({
          title: reminder.medicationData.name,
          data: [reminder],
        });
      }
      return acc;
    }, []);

    // Ordenar e organizar lembretes em subseções dentro de cada medicamento
    const sortedSections = sections.map((section) => {
      const pendingReminders = section.data.filter(
        (reminder) => reminder.Status !== "Tomado" && reminder.Status !== "Tomado em Atraso"
      );
      const completedReminders = section.data.filter(
        (reminder) => reminder.Status === "Tomado"
      );
      const lateReminders = section.data.filter(
        (reminder) => reminder.Status === "Tomado em Atraso"
      );

      return {
        ...section,
        data: pendingReminders.concat(
          { title: "Tomado em Atraso", data: lateReminders },
          { title: "Concluídos", data: completedReminders }
        ),
      };
    });

    setReminders(sortedSections);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders().finally(() => setRefreshing(false));
  };



  const handleMarkAsTaken = async (reminder) => {
    try {
      const newStatus = moment(reminder.reminderTime).isBefore(
        moment().subtract(1, "hours")
      )
        ? "Tomado em Atraso"
        : "Tomado";
  
      await updateDoc(doc(db, "remindersMedication", reminder.id), { status: newStatus });
      
      // Atualiza a lista de lembretes após a marcação
      fetchReminders(); 
    } catch (error) {
      console.error("Erro ao atualizar status do lembrete: ", error);
    }
  };
  
  const handleDelete = async (id) => {
    try {
      if (id) {
        await deleteDoc(doc(db, "remindersMedication", id));
  
        // Atualiza a lista de lembretes após a exclusão
        fetchReminders(); 
      } else {
        console.error("ID inválido para exclusão:", id);
      }
    } catch (error) {
      console.error("Erro ao deletar lembrete: ", error);
    }
  };
  

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderItem = ({ item }) => {
    if (item.data) {
      return (
        <View>
          <Text style={styles.subSectionTitle}>{item.title}</Text>
          {item.data.map((reminder) => (
            <View key={reminder.id}>{renderItem({ item: reminder })}</View>
          ))}
        </View>
      );
    }
  
    const isTaken = item.Status === "Tomado";
    const isLate = item.Status === "Tomado em Atraso";
  
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
      <View style={[styles.card, isTaken && styles.cardTaken, isLate && styles.cardLate]}>
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
          {/* Exibir botão de exclusão para todos os lembretes */}
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.trashIcon}>
            <Icon name="trash" size={24} color="red" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.reminderTime}>
            {item.formattedDate} às {item.formattedTime}
          </Text>
          {!isTaken && (
            <TouchableOpacity
              onPress={() => handleMarkAsTaken(item)}
              style={styles.takenButton}
            >
              <Text style={styles.buttonText}>Medicamento Tomado</Text>
            </TouchableOpacity>
          )}
        </View>
        {isTaken && <View style={styles.strikeThrough} />}
        {isLate && (
          <>
            <View style={styles.strikeThrough} />
            <View style={styles.strikeThroughX} />
          </>
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <SectionList
        sections={reminders}
        keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  subSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 15,
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
  },
  cardLate: {
    opacity: 0.4,
    borderColor: "red",
    borderWidth: 2,
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
  strikeThrough: {
    position: "absolute",
    left: 0,
    top: "50%",
    width: "100%",
    height: 2,
    backgroundColor: "black",
  },
  strikeThroughX: {
    position: "absolute",
    left: "50%",
    top: 0,
    width: 2,
    height: "100%",
    backgroundColor: "black",
    transform: [{ rotate: "-45deg" }],
  },
});

export default RemindersMedicationViewScreen;
