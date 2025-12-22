import "../../styles/table.css";

export default function RouteTable({ vehicles }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Araç</th>
          <th>Rota</th>
          <th>Maliyet (₺)</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <tr key={v.id}>
            <td>{v.name}</td>
            <td>{v.route.join(" -> ")}</td>
            <td>{v.totalCost}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
