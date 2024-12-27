import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const recordsPerPage = 10;

const GlicemiaMonitoramento = () => {
  const [glicemiaData, setGlicemiaData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [averageGlicemia, setAverageGlicemia] = useState(0);
  const [mostFrequentHumor, setMostFrequentHumor] = useState("");
  const [jejumDias, setJejumDias] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) {
      Alert.alert("Erro", "Selecione as datas inicial e final.");
      return;
    }

    const startTimestamp = Timestamp.fromDate(
      new Date(startDate.setHours(0, 0, 0, 0))
    );
    const endTimestamp = Timestamp.fromDate(
      new Date(endDate.setHours(23, 59, 59, 999))
    );

    const q = query(
      collection(db, "diabetes"),
      where("ID_user", "==", user.uid),
      where("Datetime", ">=", startTimestamp),
      where("Datetime", "<=", endTimestamp),
      orderBy("Datetime", "desc")
    );

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setGlicemiaData(data);
    setTotalPages(Math.ceil(data.length / recordsPerPage));
  }, [startDate, endDate, user.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const calculateStatistics = () => {
      if (!glicemiaData.length) return;

      const totalGlicemia = glicemiaData.reduce(
        (acc, curr) => acc + parseInt(curr.Glicemia, 10),
        0
      );
      const average = totalGlicemia / glicemiaData.length;
      setAverageGlicemia(average);

      const humorCounts = glicemiaData.reduce((acc, curr) => {
        acc[curr.Humor] = (acc[curr.Humor] || 0) + 1;
        return acc;
      }, {});
      const mostFrequent = Object.keys(humorCounts).reduce(
        (a, b) => (humorCounts[a] > humorCounts[b] ? a : b),
        ""
      );

      const jejumDays = glicemiaData.filter((item) => item.Infasting).length;

      setMostFrequentHumor(mostFrequent);
      setJejumDias(jejumDays);
    };

    calculateStatistics();
  }, [glicemiaData]);

  const handleDateChange = (type, selectedDate) => {
    if (type === 'start') {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setStartDate(selectedDate);
      }
    } else if (type === 'end') {
      setShowEndDatePicker(false);
      if (selectedDate) {
        setEndDate(selectedDate);
      }
    }
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

  const renderDatePickers = () => (
    <View style={styles.datePickerContainer}>
      <View style={styles.dateInputWrapper}>
        <TextInput
          style={styles.dateInput}
          value={startDate ? startDate.toLocaleDateString() : "Selecionar Data"}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Text style={styles.buttonText}>Escolher Data Inicial</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showStartDatePicker}
          mode="date"
          onConfirm={(date) => handleDateChange('start', date)}
          onCancel={() => setShowStartDatePicker(false)}
          date={startDate}
          textColor="black" // Adiciona cor ao texto
        />
      </View>
      <View style={styles.dateInputWrapper}>
        <TextInput
          style={styles.dateInput}
          value={endDate ? endDate.toLocaleDateString() : "Selecionar Data"}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Text style={styles.buttonText}>Escolher Data Final</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showEndDatePicker}
          mode="date"
          onConfirm={(date) => handleDateChange('end', date)}
          onCancel={() => setShowEndDatePicker(false)}
          date={endDate}
          textColor="black" // Adiciona cor ao texto
        />
      </View>
    </View>
  );

  const renderGlicemiaTable = () => {
    const startIndex = currentPage * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const currentData = glicemiaData.slice(startIndex, endIndex);

    return (
      <View style={styles.greenContainer}>
        <TableHeader
          headers={["Data e Hora", "Glicemia", "Em Jejum", "Humor"]}
        />
        {currentData.map((item, index) => {
          let backgroundColor = "#fff";
          if (item.Glicemia > 100) {
            backgroundColor = "#ffcccc";
          } else if (item.Glicemia < 70) {
            backgroundColor = "#ccccff";
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
        {renderPaginationControls()}
      </View>
    );
  };

  const renderPaginationControls = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        onPress={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 0}
        style={styles.paginationButton}
      >
        <Text>Anterior</Text>
      </TouchableOpacity>

      <Text style={styles.pageNumberText}>
        {currentPage + 1} de {totalPages}
      </Text>

      <TouchableOpacity
        onPress={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        style={styles.paginationButton}
      >
        <Text>Próximo</Text>
      </TouchableOpacity>
    </View>
  );

  const calculateGlicemiaSummary = () => {
    if (!glicemiaData.length) {
      return (
        <Text style={styles.summaryText}>
          Carregando dados... Por favor, selecione as datas inicial e final.
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
        A média de glicemia foi{" "}
        <Text style={styles.boldText}>{averageGlicemia.toFixed(1)} mg/dL</Text>.
        O humor mais frequente foi{" "}
        <Text style={styles.boldText}>{mostFrequentHumor}</Text>.
      </Text>
    );
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

  const GlicemiaSummarySection = () => (
    <View style={styles.summaryGreenContainer}>
      {calculateGlicemiaSummary()}
    </View>
  );

  const exportToExcel = async () => {
    const ws = XLSX.utils.json_to_sheet(
      glicemiaData.map((data) => ({
        "Data e Hora": new Date(data.Datetime.seconds * 1000).toLocaleString(),
        Glicemia: data.Glicemia,
        "Em Jejum": data.Infasting ? "Sim" : "Não",
        Humor: data.Humor,
      }))
    );

    const summaryData = [
      ["Média de Glicemia", averageGlicemia.toFixed(1)],
      ["Humor Mais Frequente", mostFrequentHumor],
      ["Dias em Jejum", jejumDias],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados de Glicemia");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo de Glicemia");

    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = `${FileSystem.cacheDirectory}glicemia.xlsx`;
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    try {
      await Sharing.shareAsync(uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Compartilhar dados de glicemia",
      });
      Alert.alert(
        "Exportação concluída",
        "Arquivo Excel foi compartilhado com sucesso."
      );
    } catch (error) {
      console.error("Erro ao compartilhar o arquivo:", error);
      Alert.alert(
        "Erro de Exportação",
        "Não foi possível compartilhar o arquivo."
      );
    }
  };

  const renderExportButton = () => (
    <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
      <MaterialCommunityIcons name="microsoft-excel" size={24} color="white" />
      <Text style={styles.exportButtonText}>Exportar para Excel</Text>
    </TouchableOpacity>
  );

  const ColorLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Legenda de Cores:</Text>
      <View style={styles.legendItem}>
        <View style={[styles.colorBox, { backgroundColor: "#ffcccc" }]} />
        <Text style={styles.legendText}>Glicemia Alta</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.colorBox, { backgroundColor: "#ccccff" }]} />
        <Text style={styles.legendText}>Glicemia Baixa</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
      }
    >
      <Text style={styles.pageTitle}>Monitoramento de Glicemia</Text>
      {renderDatePickers()}
      {renderExportButton()}
      {ColorLegend()}
      <View style={[styles.section, styles.sectionWithSpacing]}>
        <Text style={styles.title}>Glicemia - Historico</Text>
        {renderGlicemiaTable()}
      </View>
      <GlicemiaSummarySection />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
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
    alignSelf: "stretch",
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 16,
  },
  summarySection: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionWithSpacing: {
    marginTop: 20,
  },
  datePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateInputWrapper: {
    width: "50%",
    paddingRight: 5,
  },
  dateInput: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 2,
    borderColor: "#007BFF",
    backgroundColor: "#FFF",
    textAlign: "center",
    marginBottom: 5,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  exportButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  legendTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  colorBox: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  greenContainer: {
    backgroundColor: "#EDF3EF",
    borderColor: "#9CCC65",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableCell: {
    flex: 1,
    textAlign: "center",
  },
  paginationButton: {
    padding: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    marginHorizontal: 20,
  },
  pageNumberText: {
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  summaryGreenContainer: {
    backgroundColor: "#EDF3EF",
    borderColor: "#9CCC65",
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  summaryText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 24,
    textAlign: "center",
  },
  boldText: {
    fontWeight: "bold",
  },
});

export default GlicemiaMonitoramento;
