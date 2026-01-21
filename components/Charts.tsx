import React from "react";
import { View, Dimensions } from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

type Props = {
  present: number;
  absent: number;
};

const Charts: React.FC<Props> = ({ present, absent }) => {
  return (
    <View>
      {/* Bar Chart */}
      <BarChart
        data={{
          labels: ["Present", "Absent"],
          datasets: [{ data: [present, absent] }],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""   // 🔥 REQUIRED FOR TYPESCRIPT
        chartConfig={{
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: () => "#4CAF50",
          labelColor: () => "#000",
        }}
        style={{ borderRadius: 12 }}
      />

      {/* Line Chart */}
      <LineChart
        data={{
          labels: ["Day 1", "Day 2"],
          datasets: [{ data: [present, absent] }],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix=""   // 🔥 REQUIRED
        chartConfig={{
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: () => "#2196F3",
          labelColor: () => "#000",
        }}
        style={{ marginTop: 24, borderRadius: 12 }}
      />
    </View>
  );
};

export default Charts;
