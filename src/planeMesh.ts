// Create a simple screen-sized Mesh that can display a material
import * as THREE from "three";

export function createPlaneMesh<T extends THREE.Material>(
  sizes: { width: number; height: number },
  material: T
): THREE.Mesh<THREE.PlaneGeometry, T> {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);
  mesh.scale.set(sizes.width, sizes.height, 1);
  mesh.position.set(sizes.width / 2, sizes.height / 2, 0);
  mesh.rotation.z = Math.PI;
  mesh.rotation.y = Math.PI;
  return mesh;
}
