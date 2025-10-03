describe Api::ObjorderController, type: :controller do
  include_context 'initialize auth with app_token'
  include_examples :destroy_spec, ObjOrder, "obj_order", [:id, :re_ids]

  describe '#update' do
    let(:make_request) { put :update, params: params }
    let(:params) do
      {
        id: data_db_1.id,
        objtype: objtype,
        _json:
          [
            {id: data_db_3.id},
            {id: data_db_2.id},
            {id: data_db_1.id}
          ]
      }
    end

    before do
      data_db_1
      data_db_2
      data_db_3

      make_request
    end

    context 'when obj type = 1' do
      let(:data_db_1) { create(:url, order_number: 100_001) }
      let(:data_db_2) { create(:url, order_number: 100_002) }
      let(:data_db_3) { create(:url, order_number: 100_003) }
      let(:objtype) { 1 }

      it 'update successful' do
        expect(Url.count).to eq 3
        obj_db_1 = Url.find data_db_1.id
        obj_db_2 = Url.find data_db_2.id
        obj_db_3 = Url.find data_db_3.id
        expect(obj_db_1.order_number).to eq data_db_3.order_number
        expect(obj_db_2.order_number).to eq data_db_2.order_number
        expect(obj_db_3.order_number).to eq data_db_1.order_number
      end
    end

    context 'when obj type = 2' do
      let(:data_db_1) { create(:obj_order, order_number: 100_001, obj_type: "VTODO") }
      let(:data_db_2) { create(:obj_order, order_number: 100_002, obj_type: "VTODO") }
      let(:data_db_3) { create(:obj_order, order_number: 100_003, obj_type: "VTODO") }
      let(:objtype) { 2 }

      let(:params) do
        {
          id: data_db_1.id,
          objtype: 2,
          _json:
            [
              {obj_id: data_db_3.obj_id},
              {obj_id: data_db_2.obj_id},
              {obj_id: data_db_1.obj_id}
            ]
        }
      end

      it 'update successful' do
        expect(ObjOrder.count).to eq 3
        obj_db_1 = ObjOrder.find data_db_1.id
        obj_db_2 = ObjOrder.find data_db_2.id
        obj_db_3 = ObjOrder.find data_db_3.id
        expect(obj_db_1.order_number).to eq data_db_3.order_number
        expect(obj_db_2.order_number).to eq data_db_2.order_number
        expect(obj_db_3.order_number).to eq data_db_1.order_number
      end
    end

    context 'when obj type = 2 and obj_id not exist' do
      let(:data_db_1) { create(:obj_order, order_number: 100_001, obj_type: "VTODO") }
      let(:data_db_2) { create(:obj_order, order_number: 100_002, obj_type: "VTODO") }
      let(:data_db_3) { create(:obj_order, order_number: 100_003, obj_type: "VTODO") }
      let(:objtype) { 2 }

      let(:params) do
        {
          id: data_db_1.id,
          objtype: 2,
          _json:
            [
              {obj_id: data_db_3.obj_id},
              {obj_id: data_db_2.obj_id},
              {obj_id: data_db_1.obj_id},
              {obj_id: 100_000}
            ]
        }
      end

      it 'update successful' do
        expect(ObjOrder.count).to eq 4
        obj_db_1 = ObjOrder.find data_db_1.id
        obj_db_2 = ObjOrder.find data_db_2.id
        obj_db_3 = ObjOrder.find data_db_3.id
        obj_db_4 = ObjOrder.where(obj_id: 100_000).first
        expect(obj_db_3.order_number).to eq data_db_1.order_number - 1
        expect(obj_db_2.order_number).to eq data_db_1.order_number
        expect(obj_db_1.order_number).to eq data_db_2.order_number
        expect(obj_db_4.order_number).to eq data_db_3.order_number
      end

    end

    context 'when obj type = 3' do
      let(:data_db_1) { create(:kanban, order_number: 100_001) }
      let(:data_db_2) { create(:kanban, order_number: 100_002) }
      let(:data_db_3) { create(:kanban, order_number: 100_003) }
      let(:objtype) { 3 }

      it 'update successful' do
        expect(Kanban.count).to eq 3
        obj_db_1 = Kanban.find data_db_1.id
        obj_db_2 = Kanban.find data_db_2.id
        obj_db_3 = Kanban.find data_db_3.id
        expect(obj_db_1.order_number).to eq data_db_3.order_number
        expect(obj_db_2.order_number).to eq data_db_2.order_number
        expect(obj_db_3.order_number).to eq data_db_1.order_number
      end
    end

    context 'when obj type = 4' do
      let(:data_db_1) { create(:canvas, order_number: 100_001) }
      let(:data_db_2) { create(:canvas, order_number: 100_002) }
      let(:data_db_3) { create(:canvas, order_number: 100_003) }
      let(:objtype) { 4 }

      it 'update successful' do
        expect(Canvas.count).to eq 3
        obj_db_1 = Canvas.find data_db_1.id
        obj_db_2 = Canvas.find data_db_2.id
        obj_db_3 = Canvas.find data_db_3.id
        expect(obj_db_1.order_number).to eq data_db_3.order_number
        expect(obj_db_2.order_number).to eq data_db_2.order_number
        expect(obj_db_3.order_number).to eq data_db_1.order_number
      end
    end

    # TODO: Source code not handle invalid case
    # context 'when invalid' do
    # end
  end

  describe '#search' do
    let(:make_request) { post :index, params: params }
    let(:time_now) { Time.zone.now }

    before do
      data_db_1
      data_db_2
      data_db_3

      make_request
    end

    context 'when obj type = 1' do
      let(:data_db_1) { create(:url, order_number: 100_001) }
      let(:data_db_2) { create(:url, order_number: 100_002) }
      let(:data_db_3) { create(:url, order_number: 100_003) }
      let(:params) { { objtype: 1 } }

      it 'return url with no errors' do
        expect(Url.count).to eq 3
        expect(json_response[:data].count).to eq 3
      end
    end

    context 'when obj type = 2' do
      let(:data_db_1) { create(:obj_order, order_number: 100_001, obj_type: "VTODO") }
      let(:data_db_2) { create(:obj_order, order_number: 100_002, obj_type: "VTODO") }
      let(:data_db_3) { create(:obj_order, order_number: 100_003, obj_type: "VTODO") }

      let(:params) { { objtype: 2 } }

      it 'return objorder with no errors' do
        expect(ObjOrder.count).to eq 3
        expect(json_response[:data].count).to eq 3
      end
    end

    context 'when obj type = 3' do
      let(:data_db_1) { create(:kanban, order_number: 100_001) }
      let(:data_db_2) { create(:kanban, order_number: 100_002) }
      let(:data_db_3) { create(:kanban, order_number: 100_003) }

      let(:params) { { objtype: 3 } }

      it 'return kanbans with no errors' do
        expect(Kanban.count).to eq 3
        expect(json_response[:data].count).to eq 3
      end
    end

    context 'when obj type = 4' do
      let(:data_db_1) { create(:canvas, order_number: 100_001) }
      let(:data_db_2) { create(:canvas, order_number: 100_002) }
      let(:data_db_3) { create(:canvas, order_number: 100_003) }

      let(:params) { { objtype: 4 } }

      it 'return canvas with no errors' do
        expect(Canvas.count).to eq 3
        expect(json_response[:data].count).to eq 3
      end
    end
  end
end
