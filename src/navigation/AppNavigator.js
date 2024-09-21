import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
  Text,
  Modal,
  Button,
  FlatList,
} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native"; // Importe useNavigation
import HomeScreen from "../screens/HomeScreen";
import PerfilScreen from "../screens/PerfilScreen";
import DCNTScreen from "../screens/DCNT/DCNT";
import MedicalPrescriptionScreen from "../screens/medicalPrescriptionScreen";
import InformationSaudeScreen from "../screens/InformationSaudeScreen";
import InfoSaudePGScreen from "../screens/InfoSaudePG";
import MedicationScreen from "../screens/Medicamento/MedicationScreen";
import DadosSaudeSaudeScreen from "../screens/InfSaudeScreen";
import LembretesScreen from "../screens/Lembretes/LembretesScreen";
import RelRemindersConsultationScreen from "./../screens/Lembretes/Consulta/RelRemindersConsultationScreen";
import RelRemindersMedicamentotionScreen from "./../screens/Lembretes/Medicamento/RelRemindersMedicationScreen";
import HistoricoGlicemia from "../screens/DCNT/GlicemiaRellPersonalizado";
import HistoricoPressao from "../screens/DCNT/PressaoArterialRellPersonalizado";
import AuthNavigator from "./AuthNavigator";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, FontAwesome } from "@expo/vector-icons"; // ou qualquer outra biblioteca de ícones que preferir
import ChatbotScreen from "../Api/ChatbotScreen"; // Ajuste o caminho conforme necessário
import DoubtsScreen from "../Api/DoubtsScreen "; // Ajuste o caminho conforme necessário
import { db } from "../config/firebaseConfig"; // Ajuste o caminho conforme sua estrutura de projeto
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [modalVisible, setModalVisible] = useState(false);
  const [userProfileImageUrl, setUserProfileImageUrl] = useState("");
  const [isLembretesModalVisible, setLembretesModalVisible] = useState(false);
  const [isMedLembretesModalVisible, setMedLembretesModalVisible] = useState(false); // Modal para medicamentos
  const [lembretesPendentesConsultas, setLembretesPendentesConsultas] = useState([]);
  const [lembretesPendentesMedicamentos, setLembretesPendentesMedicamentos] = useState([]);
  const [pendingConsultationCount, setPendingConsultationCount] = useState(0);
  const [pendingMedicationCount, setPendingMedicationCount] = useState(0);
  const auth = getAuth();
  const storage = getStorage();
  const navigation = useNavigation();

  useEffect(() => {
    if (auth.currentUser) {
      const userImageRef = ref(
        storage,
        `profile_images/${auth.currentUser.uid}.jpg`
      );
      getDownloadURL(userImageRef)
        .then((url) => {
          setUserProfileImageUrl(url);
          Image.prefetch(url);
        })
        .catch(() => {
          setUserProfileImageUrl(
            Image.resolveAssetSource(
              require("../assets/perfil/profile-pic.jpg")
            ).uri
          );
        });
    }
  }, [auth.currentUser]);

  // Função para buscar lembretes de consultas
  const fetchConsultationReminders = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const remindersRef = collection(db, "remindersConsultation");
    const q = query(
      remindersRef,
      where("ID_user", "==", user.uid),
      where("Status", "==", 0)
    );
    try {
      const querySnapshot = await getDocs(q);
      const reminders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLembretesPendentesConsultas(reminders);
      setPendingConsultationCount(reminders.length);
    } catch (error) {
      console.error("Failed to fetch consultation reminders:", error);
    }
  };

  // Função para buscar lembretes de medicamentos
// Função para buscar lembretes de medicamentos
const fetchMedicationReminders = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const remindersRef = collection(db, "remindersMedication");
  const q = query(
    remindersRef,
    where("userId", "==", user.uid),
    where("status", "==", "Pendente") // Verifica por string "Pendente"
  );
  try {
    const querySnapshot = await getDocs(q);
    const reminders = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setLembretesPendentesMedicamentos(reminders);
    setPendingMedicationCount(reminders.length);
  } catch (error) {
    console.error("Erro ao buscar lembretes de medicamentos:", error);
  }
};

  useEffect(() => {
    fetchConsultationReminders();
    fetchMedicationReminders();
  }, [auth.currentUser]);

  // Modal para lembretes de consultas
  const handleLembretesClick = () => {
    setLembretesModalVisible(true);
  };

  // Modal para lembretes de medicamentos
  const handleMedLembretesClick = () => {
    setMedLembretesModalVisible(true);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        });
        setModalVisible(false);
      })
      .catch((error) => {
        Alert.alert("Erro ao sair", error.message);
      });
  };

 
  

  function BottomTabNavigator() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let userProfileImage =
              userProfileImageUrl ||
              Image.resolveAssetSource(
                require("../assets/perfil/profile-pic.jpg")
              ).uri;

            switch (route.name) {
              case "Home":
                iconName = focused ? "home" : "home-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              case "Duvidas":
                iconName = focused ? "help-circle" : "help-circle-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              case "Consultas":
                iconName = focused ? "alarm" : "alarm-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              case "Medicamentos":
                iconName = focused ? "medkit" : "medkit-outline";
                return <Ionicons name={iconName} size={size} color={color} />;
              case "Perfils":
                return (
                  <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Image
                      source={{ uri: userProfileImage }}
                      style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                      }}
                    />
                  </TouchableOpacity>
                );
              case "ChatBot-IA":
                iconName = focused ? "comments" : "comment";
                return (
                  <FontAwesome name={iconName} size={size} color={color} />
                );
            }
          },
          tabBarActiveTintColor: "green",
          tabBarInactiveTintColor: "gray",
          headerStyle: {
            backgroundColor: "#65BF85",
            height: 115,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 25,
          },
          tabBarStyle: { paddingBottom: 45, height: 100 },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen
          name="Consultas"
          component={LembretesScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "alarm" : "alarm-outline"} size={size} color={color} />
            ),
            tabBarBadge: pendingConsultationCount > 0 ? pendingConsultationCount : undefined,
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={handleLembretesClick}>
                {/* Abre o modal para lembretes de consultas */}
              </TouchableOpacity>
            ),
          }}
        />
         <Tab.Screen
          name="Medicamentos"
          component={LembretesScreen}
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "medkit" : "medkit-outline"} size={size} color={color} />
            ),
            tabBarBadge: pendingMedicationCount > 0 ? pendingMedicationCount : undefined,
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={handleMedLembretesClick}>
                {/* Abre o modal para lembretes de medicamentos */}
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen name="ChatBot-IA" component={ChatbotScreen} />
        <Tab.Screen name="Duvidas" component={DoubtsScreen} />
        <Tab.Screen name="Perfils" component={View} />
      </Tab.Navigator>
    );
  }

  const RenderItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    const handleComplete = async () => {
      const reminderRef = doc(db, "remindersConsultation", item.id);
      await updateDoc(reminderRef, { Status: 1 });
      setLembretesPendentesConsultas(
        lembretesPendentesConsultas.filter((reminder) => reminder.id !== item.id)
      );
      setExpanded(false);
    };

    const handleCancel = async () => {
      const reminderRef = doc(db, "remindersConsultation", item.id);
      await updateDoc(reminderRef, { Status: 2 });
      setLembretesPendentesConsultas(
        lembretesPendentesConsultas.filter((reminder) => reminder.id !== item.id)
      );
      setExpanded(false);
    };

    const formattedDate = new Date(item.date_time).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return (
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.listItemContainer}>
        <Text style={styles.listItemTitle}>
          Dr(a). {item.specialist} - {item.specialty}
        </Text>
        <Text style={styles.listItemDetail}>Local: {item.location}</Text>
        <Text style={styles.listItemDetail}>Data: {formattedDate}</Text>
        {expanded && (
          <View style={styles.buttonContainer}>
            <Button title="Concluir" onPress={handleComplete} />
            <Button title="Cancelar" onPress={handleCancel} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const RenderMedicationItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
  
    const handleComplete = async () => {
      const reminderRef = doc(db, "remindersMedication", item.id);
      await updateDoc(reminderRef, { status: "Tomado" });
      setLembretesPendentesMedicamentos(
        lembretesPendentesMedicamentos.filter((reminder) => reminder.id !== item.id)
      );
      setExpanded(false);
    };
  
    const formattedDate = new Date(item.reminderTime).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  
    return (
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.listItemContainer}>
        <View style={styles.medicationInfoContainer}>
          {/* Exibe a imagem do medicamento */}
          <Image source={{ uri: item.medicationImageUrl }} style={styles.medicationImage} />
          <View style={styles.medicationDetailsContainer}>
            {/* Exibe o nome e detalhes do medicamento */}
            <Text style={styles.listItemTitle}>{item.medicationName}</Text>
            <Text style={styles.listItemDetail}>Horário: {formattedDate}</Text>
          </View>
        </View>
        {expanded && (
          <View style={styles.buttonContainer}>
            {/* Botão com texto dentro do <Text> */}
            <TouchableOpacity onPress={handleComplete}>
              <Text style={styles.buttonText}>Tomado</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  


  return (
    <>
      <Stack.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: "#65BF85",
            height: 150,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        })}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Menu" component={BottomTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Dados Pessoais" component={PerfilScreen} />
        <Stack.Screen name="Pressão / Diabetes" component={DCNTScreen} />
        <Stack.Screen name="Receitas" component={MedicalPrescriptionScreen} />
        <Stack.Screen name="Perfil" component={InformationSaudeScreen} />
        <Stack.Screen name="Histórico" component={InfoSaudePGScreen} />
        <Stack.Screen name="Lembretes" component={LembretesScreen} />
        <Stack.Screen name="Medicamentos" component={MedicationScreen} />
        <Stack.Screen name="ChatbotScreen" component={ChatbotScreen} />
        <Stack.Screen name="Duvidas" component={DoubtsScreen} />
        <Stack.Screen name="Historico Glicemia" component={HistoricoGlicemia} />
        <Stack.Screen name="Historico Pressão Arterial" component={HistoricoPressao} />
        <Stack.Screen name="Consultas" component={RelRemindersConsultationScreen} />
        <Stack.Screen name="Informações Saúde" component={DadosSaudeSaudeScreen} />
        <Stack.Screen name="Lembrete Medicamento" component={RelRemindersMedicamentotionScreen} />
      </Stack.Navigator>

      {/* Modal para lembretes de consultas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLembretesModalVisible}
        onRequestClose={() => setLembretesModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Lembretes de Consultas Pendentes</Text>
            <FlatList
              data={lembretesPendentesConsultas}
              renderItem={({ item }) => <RenderItem item={item} />}
              keyExtractor={(item) => item.id.toString()}
              style={styles.flatListStyle}
            />
            <Button title="Fechar" onPress={() => setLembretesModalVisible(false)} />
          </View>
        </View>
      </Modal>

{/* Modal para lembretes de medicamentos */}
<Modal
  animationType="slide"
  transparent={true}
  visible={isMedLembretesModalVisible}
  onRequestClose={() => setMedLembretesModalVisible(false)}
>
  <View style={styles.centeredView}>
    <View style={styles.modalView}>
      <Text style={styles.modalTitle}>Lembretes de Medicamentos Pendentes</Text>
      {lembretesPendentesMedicamentos.length === 0 ? (
        <Text>Nenhum lembrete de medicamento pendente.</Text>
      ) : (
        <FlatList
          data={lembretesPendentesMedicamentos}
          renderItem={({ item }) => <RenderMedicationItem item={item} />}
          keyExtractor={(item) => item.id.toString()}
          style={styles.flatListStyle}
        />
      )}
      <Button title="Fechar" onPress={() => setMedLembretesModalVisible(false)} />
    </View>
  </View>
</Modal>


    </>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  listItemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff", // Fundo branco para destacar os itens
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
    borderRadius: 8,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff", // Azul para destaque
  },
  listItemDetail: {
    fontSize: 16,
    color: "#666", // Cinza para detalhes
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  medicationInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  medicationImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 10,
  },
  medicationDetailsContainer: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff", // Azul para destaque
  },
  listItemDetail: {
    fontSize: 16,
    color: "#666", // Cinza para detalhes
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
});
