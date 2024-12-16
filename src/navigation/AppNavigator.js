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
  ScrollView
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
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Card } from 'react-native-paper';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [modalVisible, setModalVisible] = useState(false);
  const [userProfileImageUrl, setUserProfileImageUrl] = useState("");
  const [isLembretesModalVisible, setLembretesModalVisible] = useState(false);
  const [isMedLembretesModalVisible, setMedLembretesModalVisible] = useState(false);
  const [lembretesPendentesConsultas, setLembretesPendentesConsultas] = useState([]);
  const [lembretesPendentesMedicamentos, setLembretesPendentesMedicamentos] = useState([]);
  const [pendingConsultationCount, setPendingConsultationCount] = useState(0);
  const [pendingMedicationCount, setPendingMedicationCount] = useState(0);
  const auth = getAuth();
  const storage = getStorage();
  const navigation = useNavigation();

const handleMarkAsTaken = async (reminder) => {
  try {
    await updateDoc(doc(db, "remindersMedication", reminder.id), { status: "Tomado" });
    fetchMedicationReminders(); // Atualiza a lista de lembretes após marcar como "Tomado"
  } catch (error) {
    console.error("Erro ao atualizar o status do lembrete: ", error);
  }
};


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


  const fetchMedicationReminders = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const remindersRef = collection(db, "remindersMedication");
    const q = query(
      remindersRef,
      where("userId", "==", user.uid),
      where("status", "==", "Pendente")
    );
    
    try {
      const querySnapshot = await getDocs(q);
      const reminders = [];
    
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
    
        // Verifica se o campo `medicationId` existe e busca as informações do medicamento correspondente
        const medicationRef = doc(db, "medications", data.medicationId);
        const medicationSnapshot = await getDoc(medicationRef);
        
        // Verifica se o documento do medicamento existe
        const medicationData = medicationSnapshot.exists() ? medicationSnapshot.data() : {};
    
        // Mapeia as informações do medicamento e do lembrete
        reminders.push({
          id: docSnapshot.id,
          medicationName: medicationData.name || "Nome não disponível",
          dosage: medicationData.dosage || "Não informado",
          medicationFormat: medicationData.form || "Formato não disponível", // Aqui está o formato
          medicationImageUrl: medicationData.imageUrl || null,  // Verifica se a imagem do medicamento está disponível
          formattedDate: new Date(data.reminderTime).toLocaleDateString('pt-BR'),
          formattedTime: new Date(data.reminderTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: data.status || "Pendente",
        });
      }
    
      setLembretesPendentesMedicamentos(reminders);
      setPendingMedicationCount(reminders.length);
    } catch (error) {
      console.error("Erro ao buscar lembretes de medicamentos:", error.message);
    }
  };
  


  const MedicationCard = ({ reminder }) => {
    const [expanded, setExpanded] = useState(false);  // Controla o estado de expansão do botão
  
    return (
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.cardContainer}>
        {/* Informações do medicamento que são sempre exibidas */}
        <View style={styles.medicationInfoContainer}>
          <Image source={{ uri: reminder.medicationImageUrl }} style={styles.medicationImage} />
          <View style={styles.medicationDetailsContainer}>
            <Text style={styles.cardTitle}>{reminder.medicationName || "Nome não disponível"}</Text>
            <Text>Dosagem: {reminder.dosage || "Não informado"}</Text>
            <Text>Data: {reminder.formattedDate || "Data não disponível"}</Text>
            <Text>Hora: {reminder.formattedTime || "Hora não disponível"}</Text>
          </View>
        </View>
  
        {/* Exibe o botão "Marcar como Tomado" apenas quando o card for expandido */}
        {expanded && (
          <TouchableOpacity onPress={() => handleMarkAsTaken(reminder)} style={styles.takenButton}>
            <Text style={styles.buttonText}>Marcar como Tomado</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };
  
  
  <Modal
  visible={isMedLembretesModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setMedLembretesModalVisible(false)}
>
  <View style={styles.centeredView}>
    <View style={styles.modalView}>
      <ScrollView>
        {lembretesPendentesMedicamentos.length > 0 ? (
          lembretesPendentesMedicamentos.map((reminder) => (
            <MedicationCard key={reminder.id} reminder={reminder} />
          ))
        ) : (
          <Text>Nenhum lembrete de medicamento</Text>
        )}
      </ScrollView>
      <Button title="Fechar" onPress={() => setMedLembretesModalVisible(false)} />
    </View>
  </View>
</Modal>

  



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
              case "Monitoramento":
                iconName = focused ? "heart" : "heart-outline";
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
        <Tab.Screen name="Monitoramento" component={HistoricoPressao} />
        <Tab.Screen name="ChatBot-IA" component={ChatbotScreen} />
        <Tab.Screen name="Duvidas" component={DoubtsScreen} />
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
  screenOptions={{
    headerStyle: {
      backgroundColor: "#65BF85",
      height: 150,
    },
    headerTintColor: "#fff",
    headerTitleStyle: {
      fontWeight: "bold",
    },
  }}
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
  <Stack.Screen
  name="RemindersMedicationView"
  component={RelRemindersMedicamentotionScreen} // Confirme que está importado corretamente
  options={{ title: "Visualizar Medicamentos" }}
/>

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
        visible={isMedLembretesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMedLembretesModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView>
              {lembretesPendentesMedicamentos.length > 0 ? (
                lembretesPendentesMedicamentos.map((reminder) => (
                  <MedicationCard key={reminder.id} reminder={reminder} />
                ))
              ) : (
                <Text>Nenhum lembrete de medicamento</Text>
              )}
            </ScrollView>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",  // Deixa o fundo escuro, mas com transparência
  },
  modalView: {
    width: "75%",  // Ajusta o tamanho do modal
    maxHeight: "70%",  // Limita a altura
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medicationInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  cardContainer: {
    backgroundColor: '#fff',
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: '100%',  // Garante que o card ocupe toda a largura da tela
  },
  medicationInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  medicationImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  medicationDetailsContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  takenButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
    alignItems: 'center',  // Centraliza o botão dentro do card
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  }
});
