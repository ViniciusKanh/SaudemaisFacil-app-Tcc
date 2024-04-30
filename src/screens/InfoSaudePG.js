// InfoSaudePG.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Button,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../config/firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";

const InfoSaudePG = () => {
  const [pressaoData, setPressaoData] = useState([]);
  const [glicemiaData, setGlicemiaData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user && startDate && endDate) {
      fetchData();
    }
  }, [user, startDate, endDate]);

  const fetchData = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Erro", "Selecione as datas inicial e final.");
      return;
    }
    await fetchPressaoArterial();
    await fetchGlicemia();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (!startDate || !endDate) {
      Alert.alert("Erro", "Selecione as datas inicial e final.");
      setRefreshing(false);
      return;
    }
    await fetchData();
    setRefreshing(false);
  }, [user, startDate, endDate]);

  const fetchPressaoArterial = async () => {
    const q = query(
      collection(db, "pressaoArterial"),
      where("UsuarioID", "==", user.uid),
      where("DataHora", ">=", startDate),
      where("DataHora", "<=", endDate),
      orderBy("DataHora", "desc")
    );
    const querySnapshot = await getDocs(q);
    setPressaoData(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const fetchGlicemia = async () => {
    const q = query(
      collection(db, "diabetes"),
      where("ID_user", "==", user.uid),
      where("Datetime", ">=", startDate),
      where("Datetime", "<=", endDate),
      orderBy("Datetime", "desc")
    );
    const querySnapshot = await getDocs(q);
    setGlicemiaData(
      querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );
  };

  const onChangeStartDate = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    } else {
      setStartDate(new Date()); // Garante que sempre haverá uma data válida
    }
  };

  const onChangeEndDate = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    } else {
      setEndDate(new Date());
    }
  };

  const TableHeader = ({ headers }) => (
    <View style={styles.tableHeaderRow}>
      {headers.map((header, index) => (
        <Text key={index} style={styles.tableHeaderCell}>
          {header}
        </Text>
      ))}
    </View>
  );

  const renderPressaoTable = () => (
    <View style={styles.table}>
      <TableHeader
        headers={["Data/Hora", "Pressão Alta/Baixa", "Humor", "Tontura/Dor"]}
      />
      {pressaoData.map((item, index) => {
        const sistolica = parseInt(item.Sistolica, 10);
        const diastolica = parseInt(item.Diastolica, 10);
        let backgroundColor = "#fff"; // Cor padrão

        // Altera a cor de fundo se a pressão estiver alta ou baixa
        if (sistolica > 140 || diastolica > 90) {
          backgroundColor = "#ffcccc"; // Vermelho claro para pressão alta
        } else if (sistolica < 110 || diastolica < 60) {
          backgroundColor = "#ccccff"; // Azul claro para pressão baixa
        }

        return (
          <View key={index} style={[styles.tableRow, { backgroundColor }]}>
            <Text style={styles.tableCell}>
              {new Date(item.DataHora.seconds * 1000).toLocaleString()}
            </Text>
            <Text
              style={styles.tableCell}
            >{`${item.Sistolica}/${item.Diastolica}`}</Text>
            <Text style={styles.tableCell}>{item.Humor}</Text>
            <Text style={styles.tableCell}>{item.Tontura ? "Sim" : "Não"}</Text>
          </View>
        );
      })}
    </View>
  );

  const calculateGlicemiaSummary = () => {
    if (!glicemiaData.length) {
      return (
        <Text style={styles.summaryText}>
          Carregando dados... ( Inserir data de inicial e Final)
        </Text>
      );
    }

    const totalGlicemia = glicemiaData.reduce(
      (acc, curr) => acc + parseInt(curr.Glicemia, 10),
      0
    );
    const averageGlicemia = totalGlicemia / glicemiaData.length;

    const humorCounts = glicemiaData.reduce((acc, curr) => {
      acc[curr.Humor] = (acc[curr.Humor] || 0) + 1;
      return acc;
    }, {});
    const mostFrequentHumor = Object.keys(humorCounts).reduce(
      (a, b) => (humorCounts[a] > humorCounts[b] ? a : b),
      ""
    );

    const jejumDias = glicemiaData.filter((item) => item.Infasting).length;

    return (
      <Text style={styles.summaryText}>
        A média de glicemia do usuário foi{" "}
        <Text style={styles.boldText}>{averageGlicemia.toFixed(1)} mg/dL</Text>{" "}
        nos últimos 30 dias. O humor mais frequente foi{" "}
        <Text style={styles.boldText}>{mostFrequentHumor}</Text>
        {", "}e a pessoa esteve em jejum por{" "}
        <Text style={styles.boldText}>{jejumDias}</Text> dias.
      </Text>
    );
  };

  const renderGlicemiaTable = () => (
    <View style={styles.table}>
      <TableHeader headers={["Data e Hora", "Glicemia", "Em Jejum", "Humor"]} />
      {glicemiaData.map((item, index) => {
        let backgroundColor = "#fff"; // Cor padrão para linhas normais

        if (item.Glicemia > 100) {
          backgroundColor = "#ffcccc"; // Vermelho claro para glicemia alta
        } else if (item.Glicemia < 70) {
          backgroundColor = "#ccccff"; // Azul claro para glicemia baixa
        }

        return (
          <View key={index} style={[styles.tableRow, { backgroundColor }]}>
            <Text style={styles.tableCell}>
              {new Date(item.Datetime.seconds * 1000).toLocaleString()}
            </Text>
            <Text style={styles.tableCell}>{`${item.Glicemia} mg/dL`}</Text>
            <Text style={styles.tableCell}>
              {item.Infasting ? "Sim" : "Não"}
            </Text>
            <Text style={styles.tableCell}>{item.Humor}</Text>
          </View>
        );
      })}
    </View>
  );

  const calculateSummary = () => {
    if (!pressaoData.length)
      return "Carregando dados... ( Inserir data de inicial e Final)";

    const totalSistolica = pressaoData.reduce(
      (acc, curr) => acc + parseInt(curr.Sistolica, 10),
      0
    );
    const totalDiastolica = pressaoData.reduce(
      (acc, curr) => acc + parseInt(curr.Diastolica, 10),
      0
    );
    const averageSistolica = totalSistolica / pressaoData.length;
    const averageDiastolica = totalDiastolica / pressaoData.length;

    const humorCounts = pressaoData.reduce((acc, curr) => {
      acc[curr.Humor] = (acc[curr.Humor] || 0) + 1;
      return acc;
    }, {});
    const mostFrequentHumor = Object.keys(humorCounts).reduce(
      (a, b) => (humorCounts[a] > humorCounts[b] ? a : b),
      ""
    );

    const tonturaDias = pressaoData.filter((item) => item.Tontura).length;

    return (
      <Text style={styles.summaryText}>
        O usuário teve uma média de pressão{" "}
        <Text style={styles.boldText}>
          {averageSistolica.toFixed(1)}/{averageDiastolica.toFixed(1)}
        </Text>{" "}
        nesses 30 dias, seus humores variaram, porém ele ficou mais{" "}
        <Text style={styles.boldText}>{mostFrequentHumor}</Text> e teve{" "}
        <Text style={styles.boldText}>{tonturaDias}</Text> dias de dor e
        tontura.
      </Text>
    );
  };

  const SummarySection = () => (
    <View style={styles.summarySection}>
      <Text style={styles.summaryText}>{calculateSummary()}</Text>
    </View>
  );
  const GlicemiaSummarySection = () => (
    <View style={styles.summarySection}>{calculateGlicemiaSummary()}</View>
  );

  const Legend = () => (
    <View style={styles.legendContainer}>
      <View style={[styles.legendIndicator, { backgroundColor: "#ffcccc" }]} />
      <Text style={styles.legendText}>Pressão/Glicemia Alta</Text>
      <View style={[styles.legendIndicator, { backgroundColor: "#ccccff" }]} />
      <Text style={styles.legendText}>Pressão/Glicemia Baixa</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
    <View style={styles.datePickerContainer}>
      <View style={styles.dateInputWrapper}>
        <TextInput
          style={styles.dateInput}
          value={startDate.toLocaleDateString()}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.buttonText}>Escolher Data Inicial</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onChangeStartDate}
          />
        )}
      </View>

      <View style={styles.dateInputWrapper}>
        <TextInput
          style={styles.dateInput}
          value={endDate.toLocaleDateString()}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.buttonText}>Escolher Data Final</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onChangeEndDate}
          />
        )}
      </View>
      
      </View>
      <Legend />

      <View style={styles.section}>
        <Text style={styles.title}>Pressão Arterial - Últimos 30 dias</Text>
        {renderPressaoTable()}
      </View>
      <SummarySection />
      <View style={[styles.section, styles.sectionWithSpacing]}>
        <Text style={styles.title}>Glicemia - Últimos 30 dias</Text>
        {renderGlicemiaTable()}
      </View>
      <GlicemiaSummarySection />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  table: {
    alignSelf: "stretch", // Para ocupar toda a largura disponível
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Para centralizar os itens na linha
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableCell: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 2, // Adiciona um pequeno espaçamento horizontal
    textAlign: "center", // Centraliza o texto na célula
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#f0f0f0", // Cor de fundo do cabeçalho
  },
  tableHeaderCell: {
    fontWeight: "bold", // Texto em negrito
    fontSize: 16, // Tamanho do texto
    // Adicione mais estilos conforme necessário
  },
  summaryText: {
    fontSize: 18, // Make sure the text is larger if needed
    marginTop: 10, // Add some space above the summary for clarity
    // Add any other styling you wish here
  },
  boldText: {
    fontWeight: "bold",
    // You might not need additional properties here as <Text> style inheritance works within nested <Text> components
  },
  // Make sure you have styles for your summarySection if you need to adjust layout or padding
  summarySection: {
    paddingTop: 10,
    paddingBottom: 20, // Adjust this value as needed for bottom padding
    // Add any other layout adjustments here
  },

  // Add a new style for the section that comes after a summary section
  sectionWithSpacing: {
    marginTop: 20, // Adjust this value as needed for top margin
  },
  datePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  dateInputWrapper: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  dateInput: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 2,
    borderColor: "#007BFF", // Cor de destaque
    marginBottom: 10, // Espaço antes do botão
    color: "#333", // Cor do texto
    backgroundColor: "#FFF", // Fundo branco para destacar
    width: "100%",
    textAlign: "center", // Centraliza o texto
    shadowColor: "#000", // Sombra para destaque
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Elevação para sombra no Android
  },
  button: {
    backgroundColor: "#007BFF", // Cor do botão
    padding: 12,
    borderRadius: 20,
    shadowColor: "#000", // Sombra para destaque
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3, // Elevação para sombra no Android
  },
  buttonText: {
    color: "#FFF", // Cor do texto do botão
    fontSize: 16, // Tamanho do texto
    fontWeight: "bold", // Negrito para destaque
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  legendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  legendText: {
    fontSize: 16,
  },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    marginBottom: 20, // Espaço antes do próximo conteúdo
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  legendIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  legendText: {
    fontSize: 16,
  },
});

export default InfoSaudePG;
